import type { Metadata } from "next";
import "./globals.css";

const DESCRIPTION =
  "Earn stocks by playing games & answering surveys. Hit $5 and unlock Apple, Tesla, NVIDIA and more.";

export const metadata: Metadata = {
  title: "Freestocks - The Easiest Way to Earn Stocks",
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Freestocks - The Easiest Way to Earn Stocks",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Freestocks - The Easiest Way to Earn Stocks",
    description: DESCRIPTION,
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
