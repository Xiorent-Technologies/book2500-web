"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tv } from "lucide-react"
import Link from "next/link"

interface Runner {
    selectionId: number
    runner: string
    ex: {
        availableToBack: Array<{ price: number; size: number }>
        availableToLay: Array<{ price: number; size: number }>
    }
}

interface EventData {
    event: {
        id: string
        name: string
        openDate: string
        countryCode: string
    }
    marketCount: number
    marketIds: Array<{
        marketId: string
        marketName: string
        totalMatched: string
    }>
    odds?: {
        eventName: string
        runners: Runner[]
    }
}

export function MatchList() {
    const [matches, setMatches] = useState<EventData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchEventsAndOdds = async () => {
            try {
                const response = await fetch("https://test.book2500.in/fetch-event/")
                const json = await response.json()
                const data: EventData[] = json.data || []

                const matchesWithOdds = await Promise.all(
                    data.slice(0, 4).map(async (match) => {
                        if (!match.marketIds?.length) return match

                        const marketId = match.marketIds[0].marketId
                        try {
                            const oddsResponse = await fetch(
                                `https://test.book2500.in/fetch-event-odds/${match.event.id}/${marketId}`,
                            )
                            const oddsData = await oddsResponse.json()
                            return { ...match, odds: oddsData.data }
                        } catch (err) {
                            console.error(`Error fetching odds for ${match.event.id}`, err)
                            return match
                        }
                    }),
                )

                setMatches(matchesWithOdds)
                setError(null)
            } catch (err) {
                console.error("Error fetching matches", err)
                setError("Failed to fetch matches")
            } finally {
                setLoading(false)
            }
        }

        fetchEventsAndOdds()
        const interval = setInterval(fetchEventsAndOdds, 5000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-4 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-purple-900 p-4">
                        <div className="h-6 bg-purple-800/50 rounded animate-pulse mb-2 w-3/4"></div>
                        <div className="h-4 bg-purple-800/50 rounded animate-pulse mb-4 w-1/2"></div>
                        <div className="grid grid-cols-6 gap-2">
                            {Array(6)
                                .fill(0)
                                .map((_, idx) => (
                                    <div key={idx} className="h-10 bg-purple-800/50 rounded animate-pulse"></div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return <div className="p-4 text-red-500 text-center">{error}</div>
    }

    if (matches.length === 0) {
        return <div className="p-4 text-center text-gray-400">No matches available</div>
    }

    return (
        <div className="flex flex-col">
            {matches.map((match) => (
                <Link
                    key={match.event.id}
                    href={`/cricket/live?match=${match.event.id}&market=${match.marketIds[0]?.marketId}`}
                    className="block border-b border-purple-900 hover:bg-[#3a2255] transition-colors"
                >
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <div className="text-gray-400 text-sm">
                                    {new Date(match.event.openDate).toLocaleString("en-IN", {
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    })}
                                </div>
                                <div className="text-white font-medium">{match.event.name}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Markets: {match.marketCount} | Country: {match.event.countryCode}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-yellow-400 p-1 rounded">
                                    <Tv size={16} className="text-black" />
                                </div>
                                <Badge className="bg-green-500 text-white">LIVE</Badge>
                            </div>
                        </div>

                        {/* Market Odds */}
                        <div className="p-1 rounded overflow-hidden text-xs bg-black/20">
                            {match.odds && Array.isArray(match.odds.runners) && match.odds.runners.length > 0 ? (
                                <>
                                    <div className="flex justify-between items-center mb-2 px-2">
                                        <div className="text-[#72bbee] font-bold">BACK</div>
                                        <div className="text-[#ff9393] font-bold">LAY</div>
                                    </div>
                                    {match.odds.runners.map((runner) => {
                                        // Check if runner is suspended (no valid odds)
                                        const isSuspended =
                                            !runner.ex?.availableToBack?.some((item) => item.price > 0) &&
                                            !runner.ex?.availableToLay?.some((item) => item.price > 0)

                                        return (
                                            <div key={runner.selectionId} className="mb-2 last:mb-0">
                                                <div className="text-white mb-1 font-medium text-xs px-2">{runner.runner}</div>
                                                <div className={`grid grid-cols-6 gap-2 relative ${isSuspended ? "opacity-80" : ""}`}>
                                                    {/* Back odds */}
                                                    {[2, 1, 0].map((index) => (
                                                        <div
                                                            key={`back-${index}`}
                                                            className={`bg-[#72bbee] rounded p-2 text-center ${index === 0 ? "bg-[#72bbee]" : index === 1 ? "bg-[#72bbee]" : "bg-[#72bbee]"
                                                                }`}
                                                        >
                                                            {runner.ex?.availableToBack?.[index] ? (
                                                                <>
                                                                    <div className="font-bold text-black">
                                                                        {runner.ex.availableToBack[index].price.toFixed(2)}
                                                                    </div>
                                                                    <div className="text-[10px] text-black/75">
                                                                        {(runner.ex.availableToBack[index].size / 1000).toFixed(1)}K
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="font-bold text-black">0.0</div>
                                                                    <div className="text-[10px] text-black/75">0.0</div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {/* Lay odds */}
                                                    {[0, 1, 2].map((index) => (
                                                        <div
                                                            key={`lay-${index}`}
                                                            className={`bg-[#ff9393] rounded p-2 text-center ${index === 0 ? "bg-[#ff9393]" : index === 1 ? "bg-[#ff9393]" : "bg-[#ff9393]"
                                                                }`}
                                                        >
                                                            {runner.ex?.availableToLay?.[index] ? (
                                                                <>
                                                                    <div className="font-bold text-black">
                                                                        {runner.ex.availableToLay[index].price.toFixed(2)}
                                                                    </div>
                                                                    <div className="text-[10px] text-black/75">
                                                                        {(runner.ex.availableToLay[index].size / 1000).toFixed(1)}K
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="font-bold text-black">0.0</div>
                                                                    <div className="text-[10px] text-black/75">0.0</div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Suspended overlay */}
                                                    {isSuspended && (
                                                        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center">
                                                            <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            ) : (
                                <div className="text-center text-gray-400 py-2">No market data available</div>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
