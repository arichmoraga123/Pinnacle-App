import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Pinnacle — Work placements in Singapore",
    template: "%s · Pinnacle",
  },
  description:
    "Pinnacle connects Singapore employers with vetted foreign workers and manages every introduction, from application to placement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} flex min-h-screen flex-col bg-paper font-sans text-ink antialiased`}
        >
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
