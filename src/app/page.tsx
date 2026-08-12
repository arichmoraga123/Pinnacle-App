import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <span className="font-mono text-xs uppercase tracking-widest text-teal">
        Scaffold ready
      </span>
      <h1 className="font-display text-4xl font-bold text-ink sm:text-6xl">
        Pinnacle
      </h1>
      <p className="max-w-md text-center text-graphite">
        Next.js 14 · App Router · TypeScript · Tailwind CSS · Drizzle ORM · Neon
      </p>
      <div className="mt-2 flex gap-4 text-sm">
        <Link href="/sign-in" className="text-teal underline-offset-2 hover:underline">
          Sign in
        </Link>
        <Link href="/sign-up" className="text-teal underline-offset-2 hover:underline">
          Sign up
        </Link>
      </div>
    </main>
  );
}
