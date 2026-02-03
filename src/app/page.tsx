import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import ProfileForm from "./components/ProfileForm";
import ThemeToggle from "./components/ThemeToggle";

export default async function Home() {
  const clerkUser = await currentUser();
  const supabase = createServerSupabaseClient();

  let profile: { first_name?: string | null; avatar_url?: string | null } | null = null;

  if (clerkUser?.id) {
    const { data } = await supabase
      .from("users")
      .select("first_name, avatar_url")
      .eq("clerk_id", clerkUser.id)
      .single();

    profile = data || null;
  }

  const displayName = profile?.first_name ? profile.first_name : "My Child";
  const avatar = profile?.avatar_url ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                width={48}
                height={48}
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/6 text-sm text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Hi, {displayName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>

        <ProfileForm />
      </main>
    </div>
  );
}
