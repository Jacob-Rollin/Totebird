import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { DemoBanner } from "@/components/demo-banner";
import { body, display } from "@/fonts/fonts";
import { hasClerkPublishable } from "@/lib/env-public";
import { safeMetadataBase } from "@/lib/metadata-base";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: {
    default: "Totebird — One link out. Everything flies home.",
    template: "%s · Totebird",
  },
  description:
    "Passwordless checklist and invoice links for freelancers. Clients open a link, drop files or pay — no accounts.",
  openGraph: {
    title: "Totebird",
    description: "One link out. Everything flies home.",
    images: ["/brand/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Totebird",
    description: "One link out. Everything flies home.",
    images: ["/brand/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Publishable key only — never touch CLERK_SECRET_KEY in the root layout graph.
  // /sign-in and /sign-up work even if DATABASE_URL is still missing.
  const clerkEnabled = hasClerkPublishable();

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers clerkEnabled={clerkEnabled}>
          <DemoBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
