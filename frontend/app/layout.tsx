import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AosInit from "@/components/AosInit";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { PopupProvider } from "@/components/PopupProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Assemble - Discover & Bookmark Your Favorite Recipes",
  description: "AI-powered food recommendation and bookmarking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <AuthProvider>
          <PopupProvider>
            <AosInit />
            <Navbar />
            <main className="flex-1">{children}</main>
          </PopupProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
