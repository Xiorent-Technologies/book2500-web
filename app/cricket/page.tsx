"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroSlider } from "@/components/hero-slider"

interface WeeklyLeader {
    user_id: string
    total_predictions: string
    investAmount: string
    user: {
        name: string
        image_url: string
        balance: string
    }
}

async function fetchHomeData() {
    try {
        const token = localStorage.getItem("auth_token")
        const headers: HeadersInit = {
            Accept: "application/json",
            "Content-Type": "application/json",
        }

        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch("https://book2500.funzip.in/api/index", { headers })
        if (!response.ok) throw new Error("Failed to fetch home data")
        return await response.json()
    } catch (error) {
        console.error("Error fetching home data:", error)
        throw error
    }
}

export default function CricketPage() {
    const [weeklyLeaders, setWeeklyLeaders] = useState<WeeklyLeader[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const data = await fetchHomeData()
                setWeeklyLeaders(data.weeklyLeader || [])
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaders()
    }, [])

    return (
        <div className="flex flex-col min-h-screen bg-[#1E0B38]">
            {/* Cricket Banner */}
            {/* <div className="relative w-full h-[200px] sm:h-[250px]">
                <Image
                    src="/cricket-banner.svg"
                    alt="Cricket Banner"
                    fill
                    className="object-cover"
                    priority
                />
            </div> */}
            <HeroSlider />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-4xl font-bold text-[#FFD700] text-center mb-6">CRICKET</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Play Now Card */}
                        <div className="bg-[#2D1A4A] rounded-lg overflow-hidden border border-purple-900">
                            <div className="relative h-full w-full">
                                <Image
                                    src="/games/cricket_game.svg"
                                    alt="Cricket Game"
                                    width={400}
                                    height={400}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <Link href="/cricket/matches">
                                <Button className="w-full rounded-none bg-[#FF0055] hover:bg-[#D10046] text-white font-bold py-4 text-lg">
                                    PLAY NOW
                                </Button>
                            </Link>
                        </div>

                        {/* Download App Card */}
                        <div className="bg-[#2D1A4A] rounded-lg p-6 text-center border border-purple-900">
                            <a href="/book2500.apk" download="book2500.apk">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="text-[#FFD700] mb-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-16 w-16"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                                key={star}
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-[#FFD700]"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <h3 className="text-xl text-[#FFD700] font-bold">DOWNLOAD</h3>
                                    <h3 className="text-xl text-[#FFD700] font-bold">OUR APP NOW!</h3>
                                </div>
                            </a>
                        </div>

                        {/* How To Play Card */}
                        <div className="bg-[#2D1A4A] rounded-lg p-6 border border-purple-900">
                            <h3 className="text-2xl text-[#FFD700] font-bold mb-4 text-center">HOW TO PLAY</h3>
                            <p className="text-white mb-6 text-sm">
                                Cricket is a bat-and-ball game played between two teams of 11 players. One team bats to score runs, while the other bowls and fields to restrict runs and take wickets. The batting team tries to score as many runs as possible, while the bowling team aims to dismiss batters. The team with the highest runs at the end wins the match.
                            </p>
                            <Link href="/cricket/matches">
                                <Button className="w-full bg-[#FF0055] hover:bg-[#D10046] text-white font-bold py-3 text-lg">
                                    PLAY NOW
                                </Button>
                            </Link>
                        </div>

                        {/* Casino Banner */}
                        <div className="relative w-full overflow-hidden">
                            <Image
                                src="/casino.svg"
                                alt="Casino Banner"
                                width={400}
                                height={200}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Right Column - Winners */}
                    <div className="lg:col-span-3">
                        <div className="bg-[#2D1A4A] rounded-lg overflow-hidden border border-purple-900">
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-[#6A1B9A] to-[#D500F9] p-4 rounded-t-lg flex items-center">
                                <h2 className="text-3xl font-bold text-[#1E0B38]">TOP PLAYERS</h2>
                                <div className="absolute right-4">
                                    <Image
                                        src="/coin.png"
                                        alt="Coin"
                                        width={50}
                                        height={50}
                                        className="w-12 h-12"
                                    />
                                </div>
                            </div>

                            {/* Winners List */}
                            <div className="px-4 pb-4">
                                {loading ? (
                                    <div className="text-center text-gray-400 py-8">Loading...</div>
                                ) : (
                                    <div className="space-y-1">
                                        {weeklyLeaders.map((leader, index) => (
                                            <div
                                                key={leader.user_id}
                                                className={`flex items-center p-3 ${index % 2 === 0 ? "bg-[#2D1A4A]" : "bg-[#3D2A5A]"
                                                    } rounded-md`}
                                            >
                                                <div className="w-8 text-center font-bold text-base sm:text-xl text-white">
                                                    {index + 1}
                                                </div>
                                                <div className="ml-4 flex-grow">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm sm:text-base text-white">
                                                            {leader.user.name}
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-gray-400">
                                                            Deposited: ₹{Number.parseFloat(leader.investAmount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs sm:text-sm text-gray-400">
                                                        Played: {leader.total_predictions}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
