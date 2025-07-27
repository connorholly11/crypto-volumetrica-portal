import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Providers } from "./providers";
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
  title: "Crypto Volumetrica Portal",
  description: "Trading portal for prop firm management and monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <Providers>
            <ErrorBoundary>
              <div className="min-h-screen flex flex-col">
                {/* Navigation Header */}
                <header className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-4">
                  <nav className="flex h-16 items-center justify-between">
                    <div className="flex items-center space-x-8">
                      <Link href="/" className="text-xl font-bold text-gray-900">
                        Volumetrica Portal
                      </Link>
                      <div className="hidden md:flex items-center space-x-6">
                        <Link 
                          href="/trader" 
                          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Trader Dashboard
                        </Link>
                        <Link 
                          href="/admin" 
                          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Placeholder for future user menu */}
                      <div className="text-sm text-gray-600">
                        Environment: Staging
                      </div>
                    </div>
                  </nav>
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1 bg-gray-50">
                {children}
              </main>

              {/* Footer */}
              <footer className="border-t bg-white py-4">
                <div className="container mx-auto px-4 text-center text-sm text-gray-600">
                  © 2025 Crypto Volumetrica Portal. For monitoring only - Trading via Volumetrica platforms.
                </div>
              </footer>
              </div>
              <Toaster position="top-right" />
            </ErrorBoundary>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
