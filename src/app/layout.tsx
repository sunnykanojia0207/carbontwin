import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/provider/providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXTAUTH_URL || "https://carbontwin.vercel.app";
const SITE_NAME = "CarbonTwin";
const SITE_DESCRIPTION =
  "CarbonTwin turns abstract carbon data into a personal companion. Understand your footprint, track it by photo or voice, and reduce it with AI-powered goals.";

// ============================================================================
// Metadata — comprehensive SEO + OpenGraph + Twitter + icons + canonical.
// Per-page metadata is set via the `metadata` export in each page.tsx.
// ============================================================================

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CarbonTwin — Understand, track & reduce your carbon footprint",
    template: "%s · CarbonTwin",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "carbon footprint",
    "sustainability",
    "climate",
    "AI carbon tracker",
    "Climate Twin",
    "carbon reduction",
    "emissions calculator",
    "green living",
    "eco-friendly",
    "carbon offset",
  ],
  authors: [{ name: "CarbonTwin", url: SITE_URL }],
  creator: "CarbonTwin",
  publisher: "CarbonTwin",
  applicationName: "CarbonTwin",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "CarbonTwin — Understand, track & reduce your carbon footprint",
    description:
      "Understand your footprint. Decide what to change. AI-powered carbon tracking for individuals.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "CarbonTwin — AI-powered carbon footprint tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarbonTwin",
    description: "Understand your footprint. Decide what to change.",
    images: ["/og.png"],
    creator: "@carbontwin",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.webmanifest",
  verification: {
    // Add Google Search Console verification token here
    // google: "your-verification-token",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F0E" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Skip to main content — visible on focus for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>

        <Providers>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
