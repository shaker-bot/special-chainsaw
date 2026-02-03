import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logSecurity } from "@/lib/logging";

const BIRTHDAY_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const BodySchema = z.object({
    first_name: z.string().max(100).nullable().optional(),
    last_name: z.string().max(100).nullable().optional(),
    avatar_url: z
        .string()
        .max(2048)
        .nullable()
        .optional()
        .refine(
            (val) => {
                if (!val) return true;
                try {
                    const url = new URL(val);
                    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
                    return url.host === supabaseHost;
                } catch {
                    return false;
                }
            },
            { message: "Avatar URL must point to a valid storage domain" },
        ),
    bio: z.string().max(500).nullable().optional(),
    birthday: z
        .string()
        .optional()
        .refine((val) => !val || BIRTHDAY_REGEX.test(val), {
            message: "Birthday must be in YYYY-MM-DD format",
        }),
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

    const supabase = createServerSupabaseClient();

    // fetch existing preferences to avoid clobbering them
    const { data: existing, error: fetchError } = await supabase
        .from("users")
        .select("preferences")
        .eq("clerk_id", user.id)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        logSecurity({ level: "error", event: "profile_fetch_failed", clerkId: user.id, detail: fetchError.message });
        return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
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
        logSecurity({ level: "error", event: "profile_upsert_failed", clerkId: user.id, detail: upsertError.message });
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
    const user = await currentUser();
    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from("users")
        .select("first_name,last_name,avatar_url,bio,preferences,updated_at")
        .eq("clerk_id", user.id)
        .single();

    if (error && error.code !== "PGRST116") {
        logSecurity({ level: "error", event: "profile_get_failed", clerkId: user.id, detail: error.message });
        return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
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
