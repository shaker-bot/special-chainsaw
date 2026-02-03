import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logSecurity } from "@/lib/logging";

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
  type: string;
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logSecurity({ level: "error", event: "webhook_secret_missing" });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await req.text();

  const wh = new Webhook(webhookSecret);
  let event: ClerkUserEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const supabase = createAdminSupabaseClient();

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;
      const email = email_addresses[0]?.email_address ?? null;

      const { error } = await supabase.from("users").upsert(
        {
          clerk_id: id,
          email,
          first_name,
          last_name,
          avatar_url: image_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clerk_id" },
      );

      if (error) {
        logSecurity({ level: "error", event: "webhook_user_upsert_failed", clerkId: id, detail: error.message });
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
      }
      break;
    }

    case "user.deleted": {
      const { id } = event.data;
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("clerk_id", id);

      if (error) {
        logSecurity({ level: "error", event: "webhook_user_delete_failed", clerkId: id, detail: error.message });
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
      }
      break;
    }
  }

  return NextResponse.json({ success: true });
}
