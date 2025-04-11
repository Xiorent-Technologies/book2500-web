// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { Tv } from "lucide-react"
// import { Badge } from "@/components/ui/badge"

// interface EventData {
//     event: {
//         id: string
//         name: string
//         countryCode: string
//         timezone: string
//         openDate: string
//     }
//     bfid: string
//     marketCount: number
//     marketIds: Array<{
//         marketId: string
//         marketName: string
//         marketStartTime: string
//         totalMatched: string
//     }>
//     scoreboard_id: string
//     selections: string
//     liability_type: number
//     undeclared_markets: number
//     odds?: {
//         runners: Array<{
//             selectionId: string
//             runner: string
//             ex?: {
//                 availableToBack?: Array<{ price: number; size: number }>
//                 availableToLay?: Array<{ price: number; size: number }>
//             }
//         }>
//     }
// }

// export default function CricketMatchesPage() {
//     const [matches, setMatches] = useState<EventData[]>([])
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState<string | null>(null)

//     const fetchEventsAndOdds = async () => {
//         try {
//             const response = await fetch("https://test.book2500.in/fetch-event/")
//             const json = await response.json()

//             const data: EventData[] = json.data

//             const matchesWithOdds = await Promise.all(
//                 data.map(async (match) => {
//                     if (!match.marketIds?.length) return match

//                     const marketId = match.marketIds[0].marketId
//                     try {
//                         const oddsResponse = await fetch(`https://test.book2500.in/fetch-event-odds/${match.event.id}/${marketId}`)
//                         const oddsData = await oddsResponse.json()
//                         return { ...match, odds: oddsData.data }
//                     } catch (err) {
//                         console.error(`Error fetching odds for ${match.event.id}`, err)
//                         return match
//                     }
//                 }),
//             )

//             setMatches(matchesWithOdds)
//             setError(null)
//         } catch (err) {
//             console.error("Error fetching matches", err)
//             setError("Failed to fetch matches")
//         } finally {
//             setLoading(false)
//         }
//     }

//     useEffect(() => {
//         fetchEventsAndOdds()
//         const interval = setInterval(fetchEventsAndOdds, 1000)
//         return () => clearInterval(interval)
//     }, [])

//     return (
//         <div className="flex flex-col min-h-screen bg-[#2a1a47]">


//             {/* Match List */}
//             <div className="bg-[#2a1a47] p-2 sm:p-3 md:p-4 flex-grow">
//                 <div className="container mx-auto">
//                     <div className="flex flex-col md:flex-row gap-6">
//                         <div className="w-full">
//                             <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">LIVE MATCHES</h2>

//                             {loading ? (
//                                 <div className="space-y-4">
//                                     {[1, 2, 3].map((i) => (
//                                         <div key={i} className="bg-[#231439] rounded-lg p-4 animate-pulse">
//                                             <div className="h-6 bg-[#3a2255] rounded w-3/4 mb-2"></div>
//                                             <div className="h-4 bg-[#3a2255] rounded w-1/2 mb-4"></div>
//                                             <div className="grid grid-cols-6 gap-2">
//                                                 {Array(6)
//                                                     .fill(0)
//                                                     .map((_, idx) => (
//                                                         <div key={idx} className="h-10 bg-[#3a2255] rounded"></div>
//                                                     ))}
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             ) : error ? (
//                                 <div className="text-center text-red-400 py-8 bg-[#231439] rounded-lg">{error}</div>
//                             ) : matches.length === 0 ? (
//                                 <div className="text-center text-gray-400 py-8 bg-[#231439] rounded-lg">No matches available</div>
//                             ) : (
//                                 <div className="space-y-4">
//                                     {matches.map((match) => (
//                                         <Link
//                                             key={match.event.id}
//                                             href={`/cricket/live?match=${match.event.id}&market=${match.marketIds[0]?.marketId}`}
//                                             className="block bg-[#231439] rounded-lg overflow-hidden hover:bg-[#3a2255] transition-colors"
//                                         >
//                                             <div className="p-4 flex flex-col gap-3">
//                                                 <div className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center">
//                                                     <div>
//                                                         <div className="text-xs text-gray-400">
//                                                             {new Date(match.event.openDate).toLocaleString("en-IN", {
//                                                                 year: "numeric",
//                                                                 month: "short",
//                                                                 day: "2-digit",
//                                                                 hour: "2-digit",
//                                                                 minute: "2-digit",
//                                                                 hour12: true,
//                                                                 timeZone: "Asia/Kolkata",
//                                                             })}{" "}
//                                                             (IST)
//                                                         </div>
//                                                         <div className="text-sm sm:text-base md:text-lg font-semibold text-white">
//                                                             {match.event.name}
//                                                         </div>
//                                                         <div className="text-xs text-gray-400 mt-1">
//                                                             Markets: {match.marketCount} | Country: {match.event.countryCode}
//                                                             {match.marketIds.length > 0 && (
//                                                                 <span className="hidden sm:inline">
//                                                                     {" "}
//                                                                      Matched: ₹
//                                                                     {Number.parseFloat(match.marketIds[0].totalMatched).toLocaleString()}
//                                                                 </span>
//                                                             )}
//                                                         </div>
//                                                     </div>
//                                                     <div className="flex items-center gap-2">
//                                                         <div className="bg-yellow-400 p-1 rounded">
//                                                             <Tv size={16} className="text-black" />
//                                                         </div>
//                                                         <Badge className="bg-green-500 text-white">LIVE</Badge>
//                                                     </div>
//                                                 </div>

//                                                 {/* Market Odds */}
//                                                 <div className="p-2 rounded overflow-hidden text-xs">
//                                                     {"odds" in match && Array.isArray(match.odds?.runners) && match.odds.runners.length > 0 ? (
//                                                         <>
//                                                             <div className="flex justify-between items-center mb-2 px-2">
//                                                                 <div className="text-[#72bbee] font-bold">BACK</div>
//                                                                 <div className="text-[#ff9393] font-bold">LAY</div>
//                                                             </div>
//                                                             {match.odds.runners.map((runner) => {
//                                                                 // Check if runner is suspended (no valid odds)
//                                                                 const isSuspended =
//                                                                     !runner.ex?.availableToBack?.some((item) => item.price > 0) &&
//                                                                     !runner.ex?.availableToLay?.some((item) => item.price > 0)

//                                                                 return (
//                                                                     <div key={runner.selectionId} className="mb-2 last:mb-0">
//                                                                         <div className="text-white mb-1 font-medium text-xs px-2">{runner.runner}</div>
//                                                                         <div
//                                                                             className={`grid grid-cols-6 gap-2 relative ${isSuspended ? "opacity-80" : ""}`}
//                                                                         >
//                                                                             {/* Back odds */}
//                                                                             {[2, 1, 0].map((index) => (
//                                                                                 <div
//                                                                                     key={`back-${index}`}
//                                                                                     className={`bg-[#72bbee] rounded p-2 text-center ${index === 0 ? "bg-[#72bbee]" : index === 1 ? "bg-[#72bbee]" : "bg-[#72bbee]"}`}
//                                                                                 >
//                                                                                     {runner.ex?.availableToBack?.[index] ? (
//                                                                                         <>
//                                                                                             <div className="font-bold text-black">
//                                                                                                 {runner.ex.availableToBack[index].price.toFixed(2)}
//                                                                                             </div>
//                                                                                             <div className="text-[10px] text-black/75">
//                                                                                                 {(runner.ex.availableToBack[index].size / 1000).toFixed(1)}K
//                                                                                             </div>
//                                                                                         </>
//                                                                                     ) : (
//                                                                                         <>
//                                                                                             <div className="font-bold text-black">0.0</div>
//                                                                                             <div className="text-[10px] text-black/75">0.0</div>
//                                                                                         </>
//                                                                                     )}
//                                                                                 </div>
//                                                                             ))}
//                                                                             {/* Lay odds */}
//                                                                             {[0, 1, 2].map((index) => (
//                                                                                 <div
//                                                                                     key={`lay-${index}`}
//                                                                                     className={`bg-[#ff9393] rounded p-2 text-center ${index === 0 ? "bg-[#ff9393]" : index === 1 ? "bg-[#ff9393]" : "bg-[#ff9393]"}`}
//                                                                                 >
//                                                                                     {runner.ex?.availableToLay?.[index] ? (
//                                                                                         <>
//                                                                                             <div className="font-bold text-black">
//                                                                                                 {runner.ex.availableToLay[index].price.toFixed(2)}
//                                                                                             </div>
//                                                                                             <div className="text-[10px] text-black/75">
//                                                                                                 {(runner.ex.availableToLay[index].size / 1000).toFixed(1)}K
//                                                                                             </div>
//                                                                                         </>
//                                                                                     ) : (
//                                                                                         <>
//                                                                                             <div className="font-bold text-black">0.0</div>
//                                                                                             <div className="text-[10px] text-black/75">0.0</div>
//                                                                                         </>
//                                                                                     )}
//                                                                                 </div>
//                                                                             ))}

//                                                                             {/* Suspended overlay */}
//                                                                             {isSuspended && (
//                                                                                 <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center rounded">
//                                                                                     <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
//                                                                                 </div>
//                                                                             )}
//                                                                         </div>
//                                                                     </div>
//                                                                 )
//                                                             })}
//                                                         </>
//                                                     ) : (
//                                                         <div className="text-center text-gray-400 py-2">No market data available</div>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         </Link>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

import { HeroSlider } from '@/components/hero-slider'
import { MatchList } from '@/components/match-list'
import React from 'react'

const page = () => {
    return (
        <section className='container mx-auto'>
            <div className="w-full relative">
                {/* Hero Banner */}
                <HeroSlider />
            </div>
            <MatchList />
        </section>
    )
}

export default page
