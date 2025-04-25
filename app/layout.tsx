// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "./styles.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ClientToaster from "./ClientToaster"

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
      <body suppressHydrationWarning={true}>
        <Header />
        {children}
        <Footer />
        <ClientToaster />
      </body>
    </html>
  )
}
