import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import { LanguageToggle } from "./components/layout/LanguageToggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rate My Neta — Civic Accountability on Solana",
  description: "Bilingual civic feedback platform verified by Janamat and immutable on Solana.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} ${notoDevanagari.variable} antialiased`}>
        <Providers>
          {children}
          <LanguageToggle />
        </Providers>
      </body>
    </html>
  );
}
