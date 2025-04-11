"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ComingSoonPage() {
    const router = useRouter()

    return (
        <div className="min-h-[calc(100vh-136px)] flex items-center justify-center">
            <div className="text-center p-8">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Coming Soon!</h1>
                <p className="text-xl text-gray-400 mb-8">We&apos;re working hard to bring you something amazing.</p>
                <Button
                    onClick={() => router.push('/')}
                    className="bg-brand-gold hover:bg-yellow-600"
                >
                    Return Home
                </Button>
            </div>
        </div>
    )
}
