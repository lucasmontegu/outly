import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";

import "../index.css";
// // import "./landing.css";
import { Plus_Jakarta_Sans, Inter, Playfair_Display } from "next/font/google";

import Providers from "@/components/providers";

const inter = Inter({subsets:['latin'],variable:'--font-inter'});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Outia - Real-Time Road Risk Intelligence | Weather & Traffic Safety",
  description:
    "Know before you go. Outia combines weather data, traffic conditions, and community reports to give you a real-time risk score (0-100) for safer departure decisions.",
  keywords: [
    "weather risk app",
    "traffic safety",
    "road conditions",
    "travel risk assessment",
    "commute safety",
    "real-time traffic",
    "weather alerts",
    "safe driving app",
  ],
  authors: [{ name: "Outia" }],
  creator: "Outia",
  publisher: "Outia",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://outia.app",
    siteName: "Outia",
    title: "Outia - Real-Time Road Risk Intelligence",
    description:
      "Know before you go. Get a real-time risk score combining weather, traffic, and community reports for safer travel decisions.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Outia - Real-Time Road Risk Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Outia - Real-Time Road Risk Intelligence",
    description:
      "Know before you go. Real-time risk scores for safer travel decisions.",
    images: ["/og-image.png"],
    creator: "@outiaapp",
  },
  alternates: {
    canonical: "https://outia.app",
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${plusJakartaSans.variable} font-sans antialiased`}
      >
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
