'use client'

import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { Wallet, History, CreditCard, ArrowDownToLine, UserCog, BookOpen, User } from 'lucide-react'

export const profileActions = [
    { label: 'Profile', icon: <User className="w-4 h-4" />, href: '/profile' },
    { label: 'Deposit', icon: <Wallet className="w-4 h-4" />, href: '/deposit' },
    { label: 'Withdraw', icon: <ArrowDownToLine className="w-4 h-4" />, href: '/withdraw' },
    { label: 'Transactions', icon: <History className="w-4 h-4" />, href: '/transaction-log' },
    { label: 'Deposit History', icon: <CreditCard className="w-4 h-4" />, href: '/deposit-log' },
    { label: 'Bet History', icon: <BookOpen className="w-4 h-4" />, href: '/bet-log' },
    // { label: 'Predictions', icon: <PiggyBank className="w-4 h-4" />, href: '/prediction' },
    { label: 'Update Profile', icon: <UserCog className="w-4 h-4" />, href: '/profile-setting' },
]

export default function ProfileSidebar() {
    const router = useRouter()
    const pathname = usePathname()

    return (
        <div className="md:col-span-3">
            <div className="bg-purple-900 rounded-lg shadow-xl p-4">
                <nav className="space-y-2">
                    {profileActions.map((action) => (
                        <Button
                            key={action.label}
                            variant="ghost"
                            className={`w-full justify-start text-white hover:bg-brand-purple hover:text-yellow-500 cursor-pointer
                ${pathname === action.href ? 'bg-brand-purple text-brand-gold' : ''}`}
                            onClick={() => router.push(action.href)}
                        >
                            {action.icon}
                            <span className="ml-2">{action.label}</span>
                        </Button>
                    ))}
                </nav>
            </div>
        </div>
    )
}
