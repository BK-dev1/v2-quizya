import type React from "react"
import type { Metadata, Viewport } from "next"
// Temporarily commenting out Google Fonts due to build network restrictions in sandbox
// TODO: Re-enable when deployed to production environment with internet access
// Tracking: This workaround is only needed for local/CI builds without internet access
// import { Inter, Geist_Mono, Cairo } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/hooks/use-auth"
import { LanguageProvider } from "@/components/providers/LanguageProvider"
import { Toaster } from "sonner"
import "./globals.css"

// Temporarily disabled due to build network restrictions
// const inter = Inter({ 
//   subsets: ["latin"], 
//   variable: "--font-inter",
//   display: "swap",
//   fallback: ["system-ui", "arial"]
// })
// const cairo = Cairo({ 
//   subsets: ["arabic"], 
//   variable: "--font-cairo",
//   display: "swap",
//   fallback: ["system-ui", "arial"]
// })
// const _geistMono = Geist_Mono({ 
//   subsets: ["latin"], 
//   variable: "--font-geist-mono",
//   display: "swap",
//   fallback: ["monospace"]
// })

export const metadata: Metadata = {
  title: "Quizya - Online Exam Platform",
  description: "Create, manage, and take exams with advanced proctoring features. The modern way to assess knowledge.",
  generator: "Quizya-Team",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#e8e4e0",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <LanguageProvider>
              {children}
              <Toaster position="top-right" />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}