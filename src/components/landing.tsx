import Link from "next/link";
import { TotebirdLogo } from "@/components/logo";
import { SessionLink } from "@/components/session-link";

/** Guest defaults — signed-in swaps happen client-side via SessionLink. */
const CTA = {
  signIn: { guest: "/sign-in", signedIn: "/app" },
  startFree: { guest: "/sign-up", signedIn: "/app" },
  startSolo: { guest: "/sign-up", signedIn: "/app/billing" },
  startStudio: { guest: "/sign-up", signedIn: "/app/billing" },
} as const;

/** Static product preview for the hero media plane — not interactive. */
function HeroProductMock() {
  return (
    <div
      className="tb-float relative h-full min-h-[340px] w-full overflow-hidden bg-[color:var(--tb-mist)] shadow-[0_28px_64px_-36px_rgba(57,69,84,0.55)] sm:min-h-[420px] lg:min-h-[520px]"
      role="img"
      aria-label="Client checklist link preview: Brand kit intake with progress and file drop"
    >
      {/* Slate product chrome */}
      <div className="flex items-center gap-3 bg-[color:var(--tb-slate)] px-5 py-4 sm:px-6">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--tb-orange)] text-sm font-bold text-white"
          aria-hidden
        >
          T
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--tb-muted-on-slate)]">
            Checklist from Maya Studio
          </p>
          <p className="truncate text-sm font-semibold text-white sm:text-base">
            Brand kit intake
          </p>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-[color:var(--tb-slate-soft)]">
            <span>2 of 4 complete</span>
            <span>50%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--tb-line)]">
            <div
              className="h-full w-1/2 rounded-full bg-[color:var(--tb-orange)]"
              aria-hidden
            />
          </div>
        </div>

        <ul className="space-y-2.5" aria-hidden>
          <li className="flex items-start gap-3 border-b border-[color:var(--tb-line)]/80 pb-3">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[color:var(--tb-orange)] bg-[color:var(--tb-orange)] text-[10px] font-bold text-white">
              ✓
            </span>
            <span className="text-sm text-[color:var(--tb-slate-soft)] line-through">
              Confirm project name
            </span>
          </li>
          <li className="flex items-start gap-3 border-b border-[color:var(--tb-line)]/80 pb-3">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[color:var(--tb-orange)] bg-[color:var(--tb-orange)] text-[10px] font-bold text-white">
              ✓
            </span>
            <span className="text-sm text-[color:var(--tb-slate-soft)] line-through">
              Upload logo (SVG or PNG)
            </span>
          </li>
          <li className="flex items-start gap-3 border-b border-[color:var(--tb-line)]/80 pb-3">
            <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[color:var(--tb-line)] bg-white" />
            <span className="text-sm text-[color:var(--tb-ink)]">
              Brand colors &amp; fonts
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[color:var(--tb-line)] bg-white" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[color:var(--tb-ink)]">
                Drop signed W-9
              </p>
              <div className="mt-2 rounded-lg border border-dashed border-[color:var(--tb-line)] bg-white px-3 py-3 text-xs text-[color:var(--tb-slate-soft)]">
                Tap to upload · max 10 MB
              </div>
            </div>
          </li>
        </ul>

        <p className="pt-1 text-center text-[11px] text-[color:var(--tb-slate-soft)]">
          No account needed · Powered by Totebird
        </p>
      </div>
    </div>
  );
}

export function LandingPage({
  clerkEnabled = false,
}: {
  /** When true, CTAs may swap to /app after Clerk hydrates. */
  clerkEnabled?: boolean;
}) {
  return (
    <div className="min-h-screen text-[color:var(--tb-ink)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--tb-line)]/70 bg-[color:var(--tb-mist)]/85 backdrop-blur-md">
        <div className="tb-shell flex items-center justify-between gap-4 py-3">
          <TotebirdLogo size="sm" variant="header" />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[color:var(--tb-slate-soft)] md:flex">
            <a href="#how" className="hover:text-[color:var(--tb-ink)]">
              How it works
            </a>
            <a href="#product" className="hover:text-[color:var(--tb-ink)]">
              Product
            </a>
            <a href="#pricing" className="hover:text-[color:var(--tb-ink)]">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[color:var(--tb-ink)]">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <SessionLink
              clerkEnabled={clerkEnabled}
              whenGuest={CTA.signIn.guest}
              whenSignedIn={CTA.signIn.signedIn}
              className="tb-btn tb-btn-ghost hidden sm:inline-flex text-sm"
            >
              Sign in
            </SessionLink>
            <SessionLink
              clerkEnabled={clerkEnabled}
              whenGuest={CTA.startFree.guest}
              whenSignedIn={CTA.startFree.signedIn}
              className="tb-btn tb-btn-primary text-sm px-4 py-2"
            >
              Start free
            </SessionLink>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — brand first, one composition; one strong logo on the left */}
        <section className="tb-hero-bg relative overflow-hidden">
          <div className="tb-shell grid min-h-[min(92vh,820px)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-16">
            <div className="tb-rise">
              <TotebirdLogo size="hero" href={null} variant="wordmark" />
              <h1 className="font-display mt-8 max-w-xl text-4xl leading-[1.08] text-[color:var(--tb-ink)] sm:text-5xl lg:text-[3.4rem]">
                One link out. Everything flies home.
              </h1>
              <p className="tb-rise-delay mt-5 max-w-md text-lg leading-relaxed text-[color:var(--tb-slate-soft)]">
                Send a passwordless checklist or invoice. Clients open the link,
                drop files or pay — no accounts, no chase.
              </p>
              <div className="tb-rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
                <SessionLink
                  clerkEnabled={clerkEnabled}
                  whenGuest={CTA.startFree.guest}
                  whenSignedIn={CTA.startFree.signedIn}
                  className="tb-btn tb-btn-primary"
                >
                  Start free
                </SessionLink>
                <Link href="/demo" className="tb-btn tb-btn-secondary">
                  Try demo
                </Link>
              </div>
              <p className="mt-5 text-sm text-[color:var(--tb-slate-soft)]">
                Free forever for 3 active links · No SMS · Stripe-ready invoices
              </p>
            </div>

            {/* Full-bleed product visual within the hero media column */}
            <div className="relative -mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full lg:justify-self-stretch">
              <HeroProductMock />
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-[color:var(--tb-line)] bg-white">
          <div className="tb-shell flex flex-wrap items-center justify-between gap-4 py-5 text-sm font-medium text-[color:var(--tb-slate-soft)]">
            <span>No client accounts</span>
            <span className="hidden text-[color:var(--tb-line)] sm:inline">·</span>
            <span>Passwordless links</span>
            <span className="hidden text-[color:var(--tb-line)] sm:inline">·</span>
            <span>Files via secure upload</span>
            <span className="hidden text-[color:var(--tb-line)] sm:inline">·</span>
            <span>You own your Stripe money</span>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="tb-section">
          <div className="tb-shell">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--tb-orange-deep)]">
              How it works
            </p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl text-[color:var(--tb-ink)] sm:text-4xl">
              Three steps. Zero client logins.
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Create a link",
                  d: "Build a checklist with file drops, or an invoice with amount and due date — from your dashboard.",
                },
                {
                  n: "02",
                  t: "Send to your client",
                  d: "Copy the passwordless URL. They open it in any browser. No signup, no password, no app install.",
                },
                {
                  n: "03",
                  t: "Get files or payment",
                  d: "Watch checklist status update live. Invoices mark paid when Stripe Checkout completes.",
                },
              ].map((step) => (
                <li key={step.n} className="relative">
                  <div className="font-display text-5xl text-[color:var(--tb-orange)]/35">
                    {step.n}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-[color:var(--tb-ink)]">
                    {step.t}
                  </h3>
                  <p className="mt-2 text-[color:var(--tb-slate-soft)] leading-relaxed">
                    {step.d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Product */}
        <section id="product" className="tb-section bg-white">
          <div className="tb-shell">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--tb-orange-deep)]">
              Launch features
            </p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl sm:text-4xl">
              Checklist and invoice — shipped together.
            </h2>
            <p className="mt-3 max-w-2xl text-[color:var(--tb-slate-soft)]">
              Briefs and testimonials come later. v1 stays sharp: collect what you
              need, get paid, leave the CRM bloat behind.
            </p>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <article className="rounded-2xl border border-[color:var(--tb-line)] bg-[color:var(--tb-sand)] p-8">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--tb-orange)] text-white font-semibold">
                  ✓
                </div>
                <h3 className="font-display mt-5 text-2xl">Checklist + file drop</h3>
                <p className="mt-3 text-[color:var(--tb-slate-soft)] leading-relaxed">
                  Itemized asks with optional uploads. Clients tick boxes and
                  attach logos, contracts, or assets — size-capped and stored in
                  your R2 bucket.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-[color:var(--tb-slate)]">
                  <li>· Passwordless `/c/[token]` page</li>
                  <li>· Progress visible in your dashboard</li>
                  <li>· Manual reminders (auto on Solo+)</li>
                </ul>
              </article>

              <article className="rounded-2xl border border-[color:var(--tb-line)] bg-[color:var(--tb-mist)] p-8">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--tb-slate)] text-white font-semibold">
                  $
                </div>
                <h3 className="font-display mt-5 text-2xl">Invoice links</h3>
                <p className="mt-3 text-[color:var(--tb-slate-soft)] leading-relaxed">
                  Amount, description, due date. Client pays via Stripe Checkout.
                  Status flips to paid when the webhook lands — Stripe remains
                  source of truth for money.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-[color:var(--tb-slate)]">
                  <li>· Passwordless `/i/[token]` page</li>
                  <li>· Overdue email nudge via Resend</li>
                  <li>· No platform payouts to reconcile</li>
                </ul>
              </article>
            </div>

            <p className="mt-8 text-sm text-[color:var(--tb-slate-soft)]">
              Coming later: creative briefs · testimonial collector · custom
              domains
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="tb-section">
          <div className="tb-shell">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--tb-orange-deep)]">
              Pricing
            </p>
            <h2 className="font-display mt-2 text-3xl sm:text-4xl">
              Stay free until it pays for itself.
            </h2>
            <p className="mt-3 max-w-xl text-[color:var(--tb-slate-soft)]">
              Annual billed at ~2 months free. Active link = client can still open
              it; closing frees a slot.
            </p>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {[
                {
                  name: "Free",
                  price: "$0",
                  note: "forever",
                  features: [
                    "3 active links",
                    "250 MB storage",
                    "Manual reminders",
                    "“Powered by Totebird”",
                  ],
                  cta: "Start free",
                  whenGuest: CTA.startFree.guest,
                  whenSignedIn: CTA.startFree.signedIn,
                  highlight: false,
                },
                {
                  name: "Solo",
                  price: "$19",
                  note: "/mo · $190/yr",
                  features: [
                    "25 active links",
                    "25 GB storage",
                    "Auto reminders",
                    "Custom branding",
                    "No invoice platform fee",
                  ],
                  cta: "Start Solo",
                  whenGuest: CTA.startSolo.guest,
                  whenSignedIn: CTA.startSolo.signedIn,
                  highlight: true,
                },
                {
                  name: "Studio",
                  price: "$39",
                  note: "/mo · $390/yr",
                  features: [
                    "Unlimited links (fair use)",
                    "100 GB storage",
                    "White-label",
                    "Seats coming later",
                  ],
                  cta: "Start Studio",
                  whenGuest: CTA.startStudio.guest,
                  whenSignedIn: CTA.startStudio.signedIn,
                  highlight: false,
                },
              ].map((tier) => (
                <article
                  key={tier.name}
                  className={`flex flex-col rounded-2xl border p-7 ${
                    tier.highlight
                      ? "border-[color:var(--tb-orange)] bg-white shadow-[0_24px_60px_-36px_rgba(234,88,12,0.55)]"
                      : "border-[color:var(--tb-line)] bg-white"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    {tier.highlight && (
                      <span className="rounded bg-[color:var(--tb-orange-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--tb-orange-deep)]">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="font-display text-4xl">{tier.price}</span>
                    <span className="mb-1 text-sm text-[color:var(--tb-slate-soft)]">
                      {tier.note}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm text-[color:var(--tb-slate)]">
                    {tier.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                  <SessionLink
                    clerkEnabled={clerkEnabled}
                    whenGuest={tier.whenGuest}
                    whenSignedIn={tier.whenSignedIn}
                    className={`tb-btn mt-8 w-full ${
                      tier.highlight ? "tb-btn-primary" : "tb-btn-secondary"
                    }`}
                  >
                    {tier.cta}
                  </SessionLink>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / social */}
        <section className="border-y border-[color:var(--tb-line)] bg-[color:var(--tb-slate)] text-white">
          <div className="tb-shell grid gap-8 py-14 md:grid-cols-3">
            {[
              {
                t: "No client accounts",
                d: "Clients never create a password. One link is enough.",
              },
              {
                t: "Passwordless by design",
                d: "Signed tokens open checklist and invoice pages — nothing to remember.",
              },
              {
                t: "Privacy-minded",
                d: "Uploads go to your R2 bucket. Payments settle in your Stripe account.",
              },
            ].map((item) => (
              <div key={item.t}>
                <h3 className="font-display text-xl text-[color:var(--tb-orange)]">
                  {item.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="tb-section bg-white">
          <div className="tb-shell max-w-3xl">
            <h2 className="font-display text-3xl sm:text-4xl">FAQ</h2>
            <dl className="mt-10 space-y-8">
              {[
                {
                  q: "Do my clients need to log in?",
                  a: "No. Every checklist and invoice is a passwordless link. They open it, complete the ask, and leave.",
                },
                {
                  q: "How big can uploads be?",
                  a: "Default cap is 10 MB per file (configurable). Free plan includes 250 MB total storage; Solo and Studio raise that.",
                },
                {
                  q: "How do invoices work with Stripe?",
                  a: "Totebird opens Stripe Checkout for the amount you set. Funds go to your Stripe account. Stripe remains the source of truth for payouts.",
                },
                {
                  q: "Can I cancel or downgrade?",
                  a: "Yes. Closing links frees Free/Solo slots anytime. Paid plans can be canceled from billing once Stripe Billing is connected — no lock-in on the product side.",
                },
                {
                  q: "Is there SMS?",
                  a: "Not in v1. Reminders go by email (Resend). We stay free-tier friendly and skip Twilio.",
                },
              ].map((item) => (
                <div key={item.q}>
                  <dt className="text-lg font-semibold text-[color:var(--tb-ink)]">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-[color:var(--tb-slate-soft)] leading-relaxed">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Final CTA */}
        <section className="tb-section tb-hero-bg">
          <div className="tb-shell text-center">
            <TotebirdLogo size="lg" href={null} />
            <h2 className="font-display mx-auto mt-6 max-w-xl text-3xl sm:text-4xl">
              Ready when your next client is.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[color:var(--tb-slate-soft)]">
              Create a checklist or invoice link in under a minute.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <SessionLink
                clerkEnabled={clerkEnabled}
                whenGuest={CTA.startFree.guest}
                whenSignedIn={CTA.startFree.signedIn}
                className="tb-btn tb-btn-primary"
              >
                Start free
              </SessionLink>
              <Link href="/demo" className="tb-btn tb-btn-secondary">
                Try demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--tb-line)] bg-white">
        <div className="tb-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold text-[color:var(--tb-ink)]">
              Totebird
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[color:var(--tb-slate-soft)]">
              Passwordless client links for freelancers. One link out. Everything
              flies home.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[color:var(--tb-ink)]">Product</p>
            <ul className="mt-3 space-y-2 text-[color:var(--tb-slate-soft)]">
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <Link href="/demo">Demo</Link>
              </li>
              <li>
                <Link href="/changelog">Changelog</Link>
              </li>
              <li>
                <Link href="/app">Dashboard</Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[color:var(--tb-ink)]">Company</p>
            <ul className="mt-3 space-y-2 text-[color:var(--tb-slate-soft)]">
              <li>
                <a href="mailto:hello@totebird.com">hello@totebird.com</a>
              </li>
              <li>
                <a
                  href="https://twitter.com/totebird"
                  target="_blank"
                  rel="noreferrer"
                >
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[color:var(--tb-ink)]">Legal</p>
            <ul className="mt-3 space-y-2 text-[color:var(--tb-slate-soft)]">
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[color:var(--tb-line)]">
          <div className="tb-shell flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-[color:var(--tb-slate-soft)]">
            <span>© {new Date().getFullYear()} Totebird</span>
            <span>Built for freelancers who hate chasing files.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
