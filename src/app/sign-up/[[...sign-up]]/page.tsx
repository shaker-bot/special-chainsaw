import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
        <SignUp />
      </div>
    </div>
  );
}
