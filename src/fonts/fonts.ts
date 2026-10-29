import localFont from "next/font/local";

/**
 * Self-hosted fonts — avoids next/font/google fetching fonts.googleapis.com
 * at build time (Netlify can fail with: cannot read properties of null
 * (reading '1') when that response is empty/blocked).
 */
export const display = localFont({
  src: [
    {
      path: "./fraunces-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fraunces-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fraunces-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

export const body = localFont({
  src: [
    {
      path: "./source-sans-3-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./source-sans-3-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./source-sans-3-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./source-sans-3-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});
