import type { Metadata, Viewport } from "next";
import { Inter, Abril_Fatface } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HydrationFlag from "@/components/HydrationFlag";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.roughcut.com.au'),
  title: {
    template: '%s | RoughCut BBQ',
    default: 'RoughCut BBQ — Know Exactly When Your BBQ Is Done',
  },
  description:
    'Free BBQ & slow-cook calculator. Enter your meat, weight, and cooking method — get a precise cook plan. No ads, no account needed. Share your before & after cooks with the community.',
  openGraph: {
    siteName: 'RoughCut BBQ',
    type: 'website',
    locale: 'en_AU',
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${abrilFatface.variable}`}>
      <body className="bg-brand-dark text-brand-text min-h-screen flex flex-col">
        <HydrationFlag />
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
