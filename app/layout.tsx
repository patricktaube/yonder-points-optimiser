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
  title: "Yonder Points Optimiser - Find Best Redemption Rates",
  description: "Free tool to find the best value redemptions for your Yonder credit card points. Compare rates across all tiers and categories to maximize your points value.",
  keywords: "Yonder card, Yonder points, credit card redemption, points optimization, Yonder calculator, Yonder experiences",
  authors: [{ name: "Yonder Points Community" }],
  openGraph: {
    title: "Yonder Points Optimiser",
    description: "Find the best value redemptions for your Yonder points",
    url: "https://yonderpoints.com",
    siteName: "Yonder Points Optimiser",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yonder Points Optimiser",
    description: "Find the best value redemptions for your Yonder points",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'application/ld+json': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Yonder Points Optimiser",
      "description": "Free tool to optimize Yonder credit card point redemptions",
      "url": "https://yonderpoints.com",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser"
    })
  }
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

