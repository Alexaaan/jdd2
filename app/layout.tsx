import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "JDD Platform - Tournois et Matchs 1v1",
  description: "Plateforme officielle pour les tournois JDD et matchs 1v1 avec classement Elo",
  generator: "v0.app",
  manifest: "/manifest.json",
  keywords: ["JDD", "tennis", "tournoi", "match", "elo", "classement", "sport"],
  authors: [{ name: "JDD Platform" }],
  creator: "JDD Platform",
  publisher: "JDD Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon-192.jpg",
    shortcut: "/icon-192.jpg",
    apple: "/icon-192.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JDD",
  },
  openGraph: {
    type: "website",
    siteName: "JDD Platform",
    title: "JDD Platform - Tournois et Matchs 1v1",
    description: "Plateforme officielle pour les tournois JDD et matchs 1v1 avec classement Elo",
  },
  twitter: {
    card: "summary",
    title: "JDD Platform - Tournois et Matchs 1v1",
    description: "Plateforme officielle pour les tournois JDD et matchs 1v1 avec classement Elo",
  },
}

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
