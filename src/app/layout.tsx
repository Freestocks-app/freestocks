import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freestocks - The Easiest Way to Earn Stocks",
  description: "Complete offers, earn cash, unlock fractional stocks. The easiest way to build your portfolio.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
