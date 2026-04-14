import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";

import { CanvasLayer } from "@/components/CanvasLayer";
import { LandingTransition } from "@/components/LandingTransition";
import { GraphicsModeProvider } from "@/components/providers/GraphicsModeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";

import "@/styles/globals.css";
import "@/styles/variables.css";

//global styles for fonts mainly for consistency

const headerFont = localFont({
  src: "./fonts/Header.otf",
  variable: "--font-header",
  display: "swap",
});

const ownersFont = localFont({
  src: [
    {
      path: "./fonts/Owners-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Owners-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/Owners-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Owners-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/Owners-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Owners-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/Owners-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Owners-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/Owners-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/Owners-BlackItalic.otf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-owners",
  display: "swap",
});

const accentFont = localFont({
  src: "./fonts/Bastone.otf",
  variable: "--font-accent",
  display: "swap",
});

const accentDisplayFont = localFont({
  src: "./fonts/Haglos.otf",
  variable: "--font-accent-display",
  display: "swap",
});

const froadmileFont = localFont({
  src: "./fonts/Froadmile.ttf",
  variable: "--font-froadmile",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tarik Skubal",
  description: "2025 MLB Cy Young Award Winner | Detroit Tigers Pitcher",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headerFont.variable} ${ownersFont.variable} ${accentFont.variable} ${accentDisplayFont.variable} ${froadmileFont.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>
        <GraphicsModeProvider>
          <LenisProvider>
            <CanvasLayer />
            <LandingTransition>{children}</LandingTransition>
          </LenisProvider>
        </GraphicsModeProvider>
      </body>
    </html>
  );
}
