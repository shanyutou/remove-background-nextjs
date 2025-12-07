import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Background Remover - Free Online Tool",
  description:
    "Remove image backgrounds instantly with AI. 100% free, runs locally in your browser. Your images never leave your device. Powered by RMBG-1.4 model.",
  keywords: [
    "background remover",
    "remove background",
    "AI",
    "image editing",
    "transparent background",
    "free",
    "online",
    "privacy",
  ],
  authors: [{ name: "AI Background Remover" }],
  openGraph: {
    title: "AI Background Remover - Free Online Tool",
    description:
      "Remove image backgrounds instantly with AI. 100% free and private.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
