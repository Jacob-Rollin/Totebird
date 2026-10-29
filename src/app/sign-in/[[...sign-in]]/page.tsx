import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ClerkSetupHint } from "@/components/clerk-setup-hint";
import { TotebirdLogo } from "@/components/logo";
import { hasClerkPublishable } from "@/lib/env-public";

export default function SignInPage() {
  // Publishable key gates the UI; secret stays server-only (Clerk SDK / API).
  if (!hasClerkPublishable()) {
    return <ClerkSetupHint intent="sign-in" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[color:var(--tb-mist)] px-4">
      <TotebirdLogo size="lg" variant="header" />
      <SignIn />
      <Link href="/" className="text-sm text-[color:var(--tb-slate-soft)]">
        ← Back to Totebird
      </Link>
    </div>
  );
}
