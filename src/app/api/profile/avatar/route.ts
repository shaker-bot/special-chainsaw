import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logSecurity } from "@/lib/logging";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET = "avatars";

const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
    "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
    "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
    "image/gif": [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
    "image/webp": [
        { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
        { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
    ],
};

const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
};

function detectMimeFromBytes(buffer: ArrayBuffer): string | null {
    const view = new Uint8Array(buffer);
    for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
        const matches = signatures.every((sig) =>
            sig.bytes.every((byte, i) => view[sig.offset + i] === byte),
        );
        if (matches) return mime;
    }
    return null;
}

export async function POST(req: Request) {
    const user = await currentUser();
    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: "File must be JPEG, PNG, WebP, or GIF" },
            { status: 400 },
        );
    }

    if (file.size > MAX_SIZE) {
        return NextResponse.json(
            { error: "File must be under 5 MB" },
            { status: 400 },
        );
    }

    // Validate actual file content via magic bytes (MIME header is spoofable)
    const fileBuffer = await file.arrayBuffer();
    const detectedMime = detectMimeFromBytes(fileBuffer);

    if (!detectedMime || !ALLOWED_TYPES.includes(detectedMime)) {
        logSecurity({ level: "warn", event: "avatar_mime_mismatch", clerkId: user.id, detail: `claimed=${file.type}` });
        return NextResponse.json(
            { error: "File content does not match an allowed image type" },
            { status: 400 },
        );
    }

    const ext = MIME_TO_EXT[detectedMime] ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const adminSupabase = createAdminSupabaseClient();
    const serverSupabase = createServerSupabaseClient();

    // Upload to Supabase Storage (requires admin/service-role access)
    const { error: uploadError } = await adminSupabase.storage
        .from(BUCKET)
        .upload(path, fileBuffer, {
            upsert: true,
            contentType: detectedMime,
        });

    if (uploadError) {
        logSecurity({ level: "error", event: "avatar_upload_failed", clerkId: user.id, detail: uploadError.message });
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = adminSupabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Update the user's avatar_url in the database (RLS-protected)
    const { error: updateError } = await serverSupabase
        .from("users")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("clerk_id", user.id);

    if (updateError) {
        logSecurity({ level: "error", event: "avatar_db_update_failed", clerkId: user.id, detail: updateError.message });
        return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
}
