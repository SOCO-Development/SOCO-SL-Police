import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans,
  Noto_Sans_Sinhala,
  Noto_Sans_Tamil,
} from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/auth/AuthGuard";
import GlobalAlertHost from "@/components/alerts/GlobalAlertHost";
import PageBackground from "@/components/layout/PageBackground";
import { publicAssetSrc } from "@/lib/publicAsset";

const logoPath = publicAssetSrc("/logo.png");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansSinhala = Noto_Sans_Sinhala({
  variable: "--font-noto-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700"],
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) }
    : {}),
  title: "SOCO - SL Police",
  description: "Sri Lanka Police Scene of Crime Operations - Command & Control Center",
  icons: {
    icon: logoPath,
    shortcut: logoPath,
    apple: logoPath,
  },
};

export const viewport: Viewport = {
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
      <head>
        <link rel="icon" href={logoPath} type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable} ${notoSansSinhala.variable} ${notoSansTamil.variable} antialiased`}
      >
        <AuthGuard>
          <PageBackground>{children}</PageBackground>
          <GlobalAlertHost />
        </AuthGuard>
      </body>
    </html>
  );
}
