import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthInitializer } from "@/components/auth/AuthInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StreamVault — Premium Streaming",
    template: "%s — StreamVault",
  },
  description:
    "Stream movies, series, anime, donghua, and micro-dramas. Cinematic experience, anytime, anywhere.",
  keywords: [
    "streaming",
    "movies",
    "series",
    "anime",
    "donghua",
    "micro-drama",
    "watch online",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <AuthInitializer />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}