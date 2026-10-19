import type { Metadata } from "next";
import localFont from "next/font/local";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import "./globals.css";
import "./portfolio.css";
import "./character-hero.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const anton = localFont({
  src: "./fonts/Anton-Regular.ttf",
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prajjwol Bhandari | Video Editing, AI Ads & Websites",
    template: "%s | Prajjwol Bhandari",
  },
  description:
    "Video editing comes first. Prajjwol Bhandari is a creative IT student in Nepal creating motion graphics, AI-generated video ads for clients, and responsive websites.",
  metadataBase: new URL("https://prajjwol-bhandari.dev"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} bg-background text-foreground antialiased`}
      >
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
