import Link from "next/link";
import { TotebirdLogo } from "@/components/logo";

export function ClerkSetupHint({ intent }: { intent: "sign-in" | "sign-up" }) {
  const title = intent === "sign-in" ? "Sign in" : "Create your account";
  const action =
    intent === "sign-in" ? "sign in" : "start a free account";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[color:var(--tb-mist)] px-4">
      <TotebirdLogo size="lg" variant="header" />
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--tb-line)] bg-white p-8 text-center shadow-[0_24px_60px_-40px_rgba(57,69,84,0.35)]">
        <h1 className="font-display text-2xl text-[color:var(--tb-ink)]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--tb-slate-soft)]">
          Clerk is not configured on this deploy, so you cannot {action} yet.
          Add{" "}
          <code className="rounded bg-[color:var(--tb-mist)] px-1.5 py-0.5 text-[color:var(--tb-ink)]">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          </code>{" "}
          and{" "}
          <code className="rounded bg-[color:var(--tb-mist)] px-1.5 py-0.5 text-[color:var(--tb-ink)]">
            CLERK_SECRET_KEY
          </code>{" "}
          in Netlify (or{" "}
          <code className="rounded bg-[color:var(--tb-mist)] px-1.5 py-0.5 text-[color:var(--tb-ink)]">
            .env.local
          </code>
          ), then redeploy.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/demo" className="tb-btn tb-btn-secondary text-sm">
            Try demo
          </Link>
          <Link href="/" className="tb-btn tb-btn-ghost text-sm">
            ← Back to Totebird
          </Link>
        </div>
      </div>
    </div>
  );
}
