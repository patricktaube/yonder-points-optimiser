import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Lobster_Two } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";   

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lobsterTwo = Lobster_Two({
  variable: "--font-lobster-two",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Yonder Points Optimiser",
  description: "Find the best value redemptions for your Yonder points",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: '#fef7f0' }}>
      <body
        className={`${manrope.variable} ${lobsterTwo.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#fef7f0', minHeight: '100vh' }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}