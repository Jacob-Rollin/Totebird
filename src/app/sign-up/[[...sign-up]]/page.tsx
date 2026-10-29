import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ClerkSetupHint } from "@/components/clerk-setup-hint";
import { TotebirdLogo } from "@/components/logo";
import { hasClerkPublishable } from "@/lib/env-public";

export default function SignUpPage() {
  // Publishable key gates the UI; secret stays server-only (Clerk SDK / API).
  if (!hasClerkPublishable()) {
    return <ClerkSetupHint intent="sign-up" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[color:var(--tb-mist)] px-4">
      <TotebirdLogo size="lg" variant="header" />
      <SignUp forceRedirectUrl="/app" fallbackRedirectUrl="/app" />
      <Link href="/" className="text-sm text-[color:var(--tb-slate-soft)]">
        ← Back to Totebird
      </Link>
    </div>
  );
}
