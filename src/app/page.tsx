import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <UserButton />
        </div>
        <p className="text-center text-zinc-400">
          You are signed in. Start building your app by editing{" "}
          <code className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-sm text-zinc-300">
            src/app/page.tsx
          </code>
        </p>
      </main>
    </div>
  );
}
