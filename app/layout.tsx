import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Chunky Tazzies — Lift heavy. Eat smart. Eat hot dogs.",
    template: "%s · Chunky Tazzies",
  },
  description:
    "A workout, nutrition, and hot-dog tracker for chunky tazzies. Log sessions, hit your macros, and let Tyler the Hot Dog talk you into one more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chunky Tazzies",
  },
  openGraph: {
    type: "website",
    title: "Chunky Tazzies — Lift heavy. Eat smart. Eat hot dogs.",
    description:
      "Workouts, macros, and a pixel-art hot dog mascot who quotes Tyler Durden at you. Built for your tazzle.",
    images: [
      {
        url: "/branding/mascot/tyler.png",
        width: 92,
        height: 92,
        alt: "Tyler the Hot Dog",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Chunky Tazzies",
    description:
      "Workouts, macros, and Tyler the Hot Dog. The first rule of Hot Dog Club: you talk about Hot Dog Club.",
    images: ["/branding/mascot/tyler.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f1de" },
    { media: "(prefers-color-scheme: dark)", color: "#231a13" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
