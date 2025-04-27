import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "EcoTracker",
  description: "Track your investments and market data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${inter.variable} h-full`}
    >
      <body className="h-full font-sans antialiased transition-colors duration-300">
        <Providers>
          <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-gray-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
