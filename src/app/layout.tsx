import type { Metadata } from "next";
import localFont from "next/font/local";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Prajjwol Bhandari | 3D Developer Portfolio",
    template: "%s | Prajjwol Bhandari",
  },
  description:
    "A high-performance 3D developer portfolio for Prajjwol Bhandari, built with Next.js, React Three Fiber, GSAP, Lenis, Tailwind CSS, and Supabase.",
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
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
