import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TotebirdLogo } from "@/components/logo";
import { hasClerk, isDemoMode } from "@/lib/env";

export default function SignInPage() {
  if (!hasClerk() || isDemoMode()) {
    redirect("/app");
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
