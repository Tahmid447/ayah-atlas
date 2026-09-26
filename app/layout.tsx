import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";
import "@/public/shared/workspace.css";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: brand.name + " — Read, reflect, connect",
  description:
    "A Quran reading and research workspace with published translations, source-linked tafsir, an evidence notebook, and cited talk preparation.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><Script src="/shared/supabase.js" strategy="beforeInteractive" /><Script src="/shared/workspace.js" strategy="beforeInteractive" /><Script src="/shared/annotations.js" strategy="beforeInteractive" />{children}</body>
    </html>
  );
}
