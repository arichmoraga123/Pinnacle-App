import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-12">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Sign in to Pinnacle
        </h1>
      </div>
      <SignIn
        forceRedirectUrl="/after-auth"
        fallbackRedirectUrl="/after-auth"
        signUpUrl="/sign-up"
      />
    </main>
  );
}
