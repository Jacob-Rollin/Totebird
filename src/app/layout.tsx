import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import { DemoBanner } from "@/components/demo-banner";
import { hasClerk } from "@/lib/env";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
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
  // Enable Clerk whenever keys exist so /sign-in and /sign-up work even if
  // the data layer is still in demo mode (e.g. missing DATABASE_URL).
  const clerkEnabled = hasClerk();

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
