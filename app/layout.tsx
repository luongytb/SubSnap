import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { PromoBox } from "@/components/promo-box";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SubSnap",
  description: "Track and manage your recurring subscriptions",
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex h-16 items-center justify-between gap-4 border-b p-4">
            <Link
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
              href="/"
            >
              <Image alt="SubSnap" height={32} src="/favicon.ico" width={32} />
              <span className="font-bold text-lg tracking-tight">SubSnap</span>
            </Link>
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="font-medium text-sm hover:underline">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="h-9 rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm hover:bg-primary/90">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </header>
          {children}
          <PromoBox />
          <script 
            defer 
            src="https://assets.onedollarstats.com/stonks.js"
          ></script>
        </body>
      </html>
    </ClerkProvider>
  );
}
