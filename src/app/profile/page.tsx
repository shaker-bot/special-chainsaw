import Header from "../components/Header";
import ProfileForm from "../components/ProfileForm";

export default async function ProfilePage() {
  return (
    <div className="min-h-screen pt-20">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface">
            Profile Settings
          </h1>
          <p className="mt-2 text-on-surface-dim">
            Manage your personal information and preferences
          </p>
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-2xl backdrop-blur-xl">
          <ProfileForm />
        </div>
      </main>
    </div>
  );
}
