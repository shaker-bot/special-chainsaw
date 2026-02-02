import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 rounded-2xl bg-white p-12 shadow-sm dark:bg-zinc-900">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <UserButton />
        </div>
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          You are signed in. Start building your app by editing{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
            src/app/page.tsx
          </code>
        </p>
      </main>
    </div>
  );
}
