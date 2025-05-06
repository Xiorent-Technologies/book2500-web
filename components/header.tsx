/* eslint-disable @next/next/no-img-element */
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, User, LogOut, Wallet } from "lucide-react"


// Mock auth context for demonstration
const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const checkAuth = () => {
        // In a real app, this would verify the token with your backend
        const token = localStorage?.getItem("auth_token")
        setIsAuthenticated(!!token)
    }

    const logout = () => {
        localStorage?.removeItem("auth_token")
        setIsAuthenticated(false)
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            checkAuth()
        }
    }, [])

    return { isAuthenticated, logout, checkAuth }
}

function Header() {
    const { isAuthenticated, logout, checkAuth } = useAuth()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        // Check auth status on mount and when auth state changes
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("auth_token")
            if (token) {
                checkAuth()
            }
        }
    }, [checkAuth])

    // Listen for storage changes (login/logout events)
    useEffect(() => {
        const handleStorageChange = () => {
            if (typeof window !== "undefined") {
                const token = localStorage.getItem("auth_token")
                if (token) {
                    checkAuth()
                }
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("storage", handleStorageChange)
            return () => window.removeEventListener("storage", handleStorageChange)
        }
    }, [checkAuth])

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const navigationLinks = [
        { href: "/", icon: "🏠", label: "HOME", color: "text-yellow-400" },
        { href: "/cricket", icon: "🏏", label: "CRICKET", color: "text-red-400" },
        { href: "/coming-soon", icon: "🎮", label: "TEEN PATTI", color: "text-pink-400" },
        { href: "/coming-soon", icon: "🎲", label: "MATAKA", color: "text-purple-400" },
        { href: "/coming-soon", icon: "✈️", label: "AVIATOR", color: "text-blue-400" },
        { href: "/coming-soon", icon: "🐉", label: "DRAGON & TIGER", color: "text-orange-400" },
        { href: "/coming-soon", icon: "♠️", label: "POKER KING", color: "text-green-400" },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-[#3a1a5e]">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex-shrink-0">
                    <div className="h-16 w-32 flex items-center justify-center">
                        <img src="/logo.svg" alt="Book2500 Logo" className="h-full w-auto object-contain" />
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <div className="hidden sm:flex items-center gap-2 text-gray-200">{/* Balance would go here */}</div>
                            <Link href="/deposit">
                                <Button variant="ghost" size="icon" className="bg-[#4c2a70] text-white">
                                    <Wallet className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/profile">
                                <Button variant="ghost" size="icon" className="bg-[#4c2a70] text-white">
                                    <User className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Button
                                onClick={() => {
                                    logout()
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">Try Now</Button>
                            </Link>
                        </>
                    )}

                    {/* Hamburger menu for mobile */}
                    <button
                        className="md:hidden ml-1 sm:ml-2 p-1 sm:p-2 text-white"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="bg-black/20 hidden md:block">
                <div className="container mx-auto px-4">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {navigationLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`flex items-center gap-1 px-4 py-2 whitespace-nowrap ${pathname === link.href ? "bg-[#4c2a70]" : ""
                                    }`}
                            >
                                <span className={link.color}>{link.icon}</span>
                                <span className="text-white">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-[#2a1a47] absolute z-50 w-full shadow-lg">
                    <div className="flex flex-col">
                        {navigationLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`flex items-center gap-1 px-4 py-3 border-b border-gray-700 ${pathname === link.href ? "bg-[#4c2a70]" : ""
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className={link.color}>{link.icon}</span>
                                <span className="text-white">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    )
}

export default Header;