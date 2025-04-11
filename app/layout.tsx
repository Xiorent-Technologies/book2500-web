import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "sonner"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Betting Platform",
  description: "A web-based betting platform for sports and casino games",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} `}>
        <Header />
        {children}
        <Footer />
        <Toaster richColors expand={true} position="top-center" />
      </body>
    </html>
  )
}
