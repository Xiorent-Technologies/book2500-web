"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Construction } from "lucide-react"

export default function ComingSoonPage() {
    const router = useRouter()

    return (
        <div className="min-h-[calc(100vh-136px)] flex items-center justify-center bg-[#2a1a47]">
            <div className="bg-[#231439] p-8 md:p-12 rounded-lg border border-purple-900 shadow-xl max-w-2xl mx-4">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-[#3a2255] rounded-full flex items-center justify-center">
                        <Construction className="w-10 h-10 text-[#FFD700]" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-[#FFD700] mb-4">Coming Soon!</h1>
                    <p className="text-xl text-gray-400 mb-8">
                        We&apos;re working hard to bring you something amazing. Stay tuned!
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-[#FF0055] hover:bg-[#D10046] text-white px-8 py-6 text-lg font-bold"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        </div>
    )
}
