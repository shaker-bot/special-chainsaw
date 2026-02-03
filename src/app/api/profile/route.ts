import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const BodySchema = z.object({
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    birthday: z.string().optional(), // YYYY-MM-DD or empty string to remove
});


export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const user = await currentUser();
    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // fetch existing preferences to avoid clobbering them
    const { data: existing, error: fetchError } = await supabase
        .from("users")
        .select("preferences")
        .eq("clerk_id", user.id)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116: no rows found (single() with no rows). We'll treat as empty.
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const oldPrefs = existing?.preferences ?? {};
    const newPrefs = { ...(oldPrefs as Record<string, unknown>) };

    if (parsed.data.birthday !== undefined) {
        if (parsed.data.birthday) {
            newPrefs.birthday = parsed.data.birthday;
        } else {
            delete newPrefs.birthday;
        }
    }

    const payload = {
        clerk_id: user.id,
        first_name: parsed.data.first_name ?? null,
        last_name: parsed.data.last_name ?? null,
        avatar_url: parsed.data.avatar_url ?? null,
        bio: parsed.data.bio ?? null,
        preferences: newPrefs,
        updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase.from("users").upsert(payload, {
        onConflict: "clerk_id",
    });

    if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
    const user = await currentUser();
    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
        .from("users")
        .select("first_name,last_name,avatar_url,bio,preferences,updated_at")
        .eq("clerk_id", user.id)
        .single();

    if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build ETag from updated_at (or a fallback for new/missing rows)
    const updatedAt = data?.updated_at ?? "empty";
    const etag = `"profile-${Buffer.from(updatedAt).toString("base64url")}"`;

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
        return new Response(null, {
            status: 304,
            headers: {
                ETag: etag,
                "Cache-Control": "private, no-cache",
            },
        });
    }

    return NextResponse.json(
        { data: data ?? null },
        {
            headers: {
                ETag: etag,
                "Cache-Control": "private, no-cache",
            },
        }
    );
}
