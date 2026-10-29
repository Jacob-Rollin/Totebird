import Image from "next/image";
import Link from "next/link";
import { TotebirdLogo } from "@/components/logo";
import { hasClerk, isDemoMode } from "@/lib/env";

const signupHref = () =>
  hasClerk() && !isDemoMode() ? "/sign-up" : "/app";

const signinHref = () =>
  hasClerk() && !isDemoMode() ? "/sign-in" : "/app";

export function LandingPage() {
  const start = signupHref();
  const signIn = signinHref();

  return (
    <div className="min-h-screen text-[color:var(--tb-ink)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--tb-line)]/70 bg-[color:var(--tb-mist)]/85 backdrop-blur-md">
        <div className="tb-shell flex items-center justify-between gap-4 py-3">
          <TotebirdLogo size="md" variant="header" />
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
            <Link href={signIn} className="tb-btn tb-btn-ghost hidden sm:inline-flex text-sm">
              Sign in
            </Link>
            <Link href={start} className="tb-btn tb-btn-primary text-sm px-4 py-2">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — brand first, one composition */}
        <section className="tb-hero-bg relative overflow-hidden">
          <div className="tb-shell grid min-h-[min(92vh,820px)] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
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
                <Link href={start} className="tb-btn tb-btn-primary">
                  Start free
                </Link>
                <Link href="/demo" className="tb-btn tb-btn-secondary">
                  Try demo
                </Link>
              </div>
              <p className="mt-5 text-sm text-[color:var(--tb-slate-soft)]">
                Free forever for 3 active links · No SMS · Stripe-ready invoices
              </p>
            </div>

            <div className="tb-float relative mx-auto w-full max-w-lg lg:mx-0">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.18),transparent_55%)]"
              />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[color:var(--tb-line)] bg-white p-6 shadow-[0_30px_80px_-40px_rgba(57,69,84,0.45)] sm:p-8">
                <Image
                  src="/brand/lockup-horizontal.png"
                  alt="Totebird — One link out. Everything flies home."
                  width={1200}
                  height={260}
                  className="h-auto w-full object-contain"
                  priority
                />
                <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl bg-[color:var(--tb-slate)] p-4">
                  <Image
                    src="/brand/icon/icon-orange-bird.png"
                    alt=""
                    width={72}
                    height={72}
                    className="h-14 w-14 object-contain"
                  />
                  <Image
                    src="/brand/wordmark-white-orange.png"
                    alt="Totebird"
                    width={480}
                    height={120}
                    className="h-auto w-full max-w-[280px] object-contain"
                  />
                </div>
              </div>
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
                  href: start,
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
                  href: start,
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
                  href: start,
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
                  <Link
                    href={tier.href}
                    className={`tb-btn mt-8 w-full ${
                      tier.highlight ? "tb-btn-primary" : "tb-btn-secondary"
                    }`}
                  >
                    {tier.cta}
                  </Link>
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
              <Link href={start} className="tb-btn tb-btn-primary">
                Start free
              </Link>
              <Link href="/demo" className="tb-btn tb-btn-secondary">
                Try demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--tb-line)] bg-white">
        <div className="tb-shell flex flex-col gap-8 py-12 md:flex-row md:justify-between">
          <div>
            <TotebirdLogo size="sm" />
            <p className="mt-3 max-w-xs text-sm text-[color:var(--tb-slate-soft)]">
              Passwordless client links for freelancers. One link out. Everything
              flies home.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
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
                  <Link href="/app">Dashboard</Link>
                </li>
              </ul>
            </div>
            <div>
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
            <div>
              <p className="font-semibold text-[color:var(--tb-ink)]">Legal</p>
              <ul className="mt-3 space-y-2 text-[color:var(--tb-slate-soft)]">
                <li>
                  <span className="opacity-60">Privacy (soon)</span>
                </li>
                <li>
                  <span className="opacity-60">Terms (soon)</span>
                </li>
              </ul>
            </div>
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
