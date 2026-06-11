import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TraveTrace – taktisk företagsresearch",
  description:
    "AI-driven företagsanalys för B2B-säljare: säljinsikter, finansiella signaler och spår av vilket affärssystem målbolaget använder.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bakgrund text-skrift antialiased">
        {children}
      </body>
    </html>
  );
}
