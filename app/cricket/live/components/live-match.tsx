"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VideoStream } from "./video-stream"
import { toast } from "sonner"
import { createPrediction, type PredictionData } from "@/lib/api"
import { updateBalanceFromAPI } from "@/lib/utils"

interface Runner {
    selectionId: number | string
    runner: string
    ex?: {
        availableToBack?: Array<{ price: number; size: number }>
        availableToLay?: Array<{ price: number; size: number }>
    }
}

interface SelectedBet {
    name: string
    type: string
    section: string
    selectionId?: number | string
}

interface BookmakerMarket {
    marketId: string
    evid: string
    inplay: boolean
    mname: string
    min: string
    max: string
    rem: string
    runners: BookmakerRunner[]
    status: string
}

interface BookmakerRunner extends BetItem {
    selectionId: number
    runnerName: string
    status: string
    lastPriceTraded: number
    totalMatched: number
    batb: Array<[number, number]>
    batl: Array<[number, number]>
}

interface FancyOdds extends BetItem {
    RunnerName: string
    BackPrice1: number
    BackSize1: number
    LayPrice1: number
    LaySize1: number
    isSuspended?: boolean
    slidingText?: string
}

interface BetItem extends Runner {
    batb?: [number, number][]
    batl?: [number, number][]
    BackPrice1?: number
    LayPrice1?: number
    BackSize1?: number
    LaySize1?: number
    RunnerName?: string
    runnerName?: string
    isSuspended?: boolean
    SelectionId?: number | string
}

const MIN_STAKE = 100
const MAX_STAKE = 250000
const predefinedStakes = [
    [100, 500, 1000, 2000],
    [5000, 10000, 25000, 50000],
]

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Add these type guards after the interfaces
function isMatchRunner(runner: Runner | BookmakerRunner | FancyOdds): runner is Runner {
    return 'ex' in runner
}

function isBookmakerRunner(runner: Runner | BookmakerRunner | FancyOdds): runner is BookmakerRunner {
    return 'batb' in runner && 'batl' in runner
}

function isFancyRunner(runner: Runner | BookmakerRunner | FancyOdds): runner is FancyOdds {
    return 'BackPrice1' in runner && 'LayPrice1' in runner
}

export default function LiveMatch() {
    const router = useRouter()
    const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null)
    const [selectedOdds, setSelectedOdds] = useState("")
    const [selectedStake, setSelectedStake] = useState("")
    const [eventOdds, setEventOdds] = useState<{ eventName: string; runners: Runner[] }>({
        eventName: "",
        runners: [],
    })
    const [fancyOdds, setFancyOdds] = useState<FancyOdds[]>([])
    const [bookmakerMarket, setBookmakerMarket] = useState<BookmakerMarket | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [betError, setBetError] = useState<string | null>(null)
    const [userBalance, setUserBalance] = useState<string>("0")
    const [showMobileBetForm, setShowMobileBetForm] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        matchOdds: true,
        bookmaker: true,
        fancy: true,
    })
    const [showVideo, setShowVideo] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    const searchParams = useSearchParams()
    const eventId = searchParams.get("match")
    const marketId = searchParams.get("market")

    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Check if we're on mobile
    useEffect(() => {
        if (isBrowser) {
            const checkMobile = () => {
                setIsMobile(window.innerWidth < 1024)
            }
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [])

    // const updateAndStoreBalance = async () => {
    //     try {
    //         const profile = await fetchUserProfile()
    //         if (profile?.balance) {
    //             const balanceStr = profile.balance.toString()

    //             setUserBalance(balanceStr)

    //             const userData = localStorage.getItem('user_data')
    //             if (userData) {
    //                 const parsedData = JSON.parse(userData)
    //                 parsedData.balance = balanceStr
    //                 localStorage.setItem('user_data', JSON.stringify(parsedData))
    //             }
    //         }
    //     } catch (error) {
    //         console.error("Error updating balance:", error)
    //         toast.error("Failed to update balance")
    //     }
    // }

    // Initial balance load from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user_data')
        if (userData) {
            try {
                const parsedData = JSON.parse(userData)
                if (parsedData.balance) {
                    setUserBalance(parsedData.balance)
                }
            } catch (error) {
                console.error("Error parsing user data:", error)
            }
        }

        // Set up balance update interval
        const balanceInterval = setInterval(async () => {
            try {
                const newBalance = await updateBalanceFromAPI()
                if (newBalance) {
                    setUserBalance(newBalance)
                }
            } catch (error) {
                console.error("Error in balance interval:", error)
            }
        }, 5000)

        return () => clearInterval(balanceInterval)
    }, [])

    useEffect(() => {
        const handleMessage = (event: MessageEvent<unknown>) => {
            if (event.origin === "https://www.satsports.net" && event.data) {
                console.log("Score update:", event.data)
            }
        }

        if (isBrowser) {
            window.addEventListener("message", handleMessage)
            return () => window.removeEventListener("message", handleMessage)
        }
    }, [])

    const handleStakeButton = (type: "min" | "max" | "predefined", value?: number) => {
        if (type === "predefined" && value) {
            setSelectedStake(value.toString())
        } else {
            setSelectedStake(type === "min" ? MIN_STAKE.toString() : MAX_STAKE.toString())
        }
    }

    const handleClearStake = () => {
        setSelectedStake("")
        setSelectedOdds("")
    }

    const toggleSection = (section: "matchOdds" | "bookmaker" | "fancy") => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    const handlePlaceBet = async () => {
        if (!isBrowser) return

        const token = localStorage.getItem("auth_token")
        if (!token) {
            toast.error("Please login to place bets")
            router.push("/login")
            return
        }

        setBetError(null)

        if (!selectedBet || !selectedOdds || !selectedStake) {
            toast.error("Please select odds and enter stake amount")
            return
        }

        const stakeAmount = Number.parseFloat(selectedStake)
        if (isNaN(stakeAmount) || stakeAmount < MIN_STAKE || stakeAmount > MAX_STAKE) {
            toast.error(`Stake must be between ${MIN_STAKE} and ${MAX_STAKE}`)
            return
        }

        const currentBalance = Number.parseFloat(userBalance)
        if (isNaN(currentBalance) || currentBalance < stakeAmount) {
            toast.error("Insufficient balance. Please add funds to your account.")
            return
        }

        try {
            const betData: PredictionData = {
                invested_amount: stakeAmount,
                event_id: eventId!,
                market_id: marketId!,
                selection_id: selectedBet.selectionId?.toString() || "",
                type: "event-odds",
                is_back: selectedBet.type === 'BACK',
                ratio: Number(selectedOdds),
                level: 1,
                bet_category: selectedBet.section.toLowerCase(),
                match_name: eventOdds.eventName,
                runner_name: selectedBet.name
            }

            const response = await createPrediction(betData)

            if (response.success) {
                // Update balance in localStorage and state
                const newBalance = (Number(userBalance) - stakeAmount).toString()
                const userData = localStorage.getItem('user_data')
                if (userData) {
                    const parsedData = JSON.parse(userData)
                    parsedData.balance = newBalance
                    localStorage.setItem('user_data', JSON.stringify(parsedData))
                }
                setUserBalance(newBalance)

                toast.success("Bet Placed Successfully!", {
                    description: `${selectedBet.name} - ₹${selectedStake} @ ${selectedOdds}`
                })

                handleClearStake()
                setSelectedBet(null)
                setShowMobileBetForm(false)
            } else {
                toast.error("Failed to place bet", {
                    description: response.message || "Please try again"
                })
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error("Error placing bet", {
                    description: error instanceof Error ? error.message : "Please try again"
                })
            } else {
                toast.error("Error placing bet", {
                    description: "An unknown error occurred. Please try again"
                })
            }
            toast.error("Error placing bet", {
                description: error instanceof Error ? error.message : "Please try again"
            })
        }
    }

    const handleOddsClick = (
        runner: Runner | BookmakerRunner | FancyOdds,
        type: "back" | "lay" | "no" | "yes",
        section: "match" | "bookmaker" | "fancy"
    ) => {
        setBetError(null)

        try {
            let isSuspended = false

            if (section === "match" && isMatchRunner(runner)) {
                isSuspended = [0, 1, 2].some(index => {
                    const backOdds = runner.ex?.availableToBack?.[index]?.price ?? 0;
                    const layOdds = runner.ex?.availableToLay?.[index]?.price ?? 0;
                    return backOdds <= 0 || layOdds <= 0;
                });
            } else if (section === "bookmaker" && isBookmakerRunner(runner)) {
                isSuspended = [0].some(index => {
                    const backOdds = runner.batb?.[index]?.[0] ?? 0;
                    const layOdds = runner.batl?.[index]?.[0] ?? 0;
                    return backOdds <= 0 || layOdds <= 0;
                });
            } else if (section === "fancy" && isFancyRunner(runner)) {
                isSuspended = runner.BackPrice1 <= 0 || runner.LayPrice1 <= 0;
            }

            if (isSuspended) {
                setBetError("This market is currently suspended")
                return
            }

            let oddsValue = ""

            if (section === "match" && isMatchRunner(runner)) {
                if (!runner.ex) return
                const odds = type === "back" ? runner.ex.availableToBack?.[0] : runner.ex.availableToLay?.[0]
                if (!odds || typeof odds.price !== "number" || odds.price <= 0) {
                    setBetError("Invalid odds data for match bet")
                    return
                }
                oddsValue = odds.price.toFixed(2)
            } else if (section === "bookmaker" && isBookmakerRunner(runner)) {
                const price = type === "back" ? runner.batb?.[0]?.[0] : runner.batl?.[0]?.[0]
                if (!price || price <= 0) {
                    setBetError("Invalid odds data for bookmaker bet")
                    return
                }
                oddsValue = price.toFixed(2)
            } else if (section === "fancy" && isFancyRunner(runner)) {
                const price = type === "no" ? runner.BackPrice1 : runner.LayPrice1
                if (!price || price <= 0) {
                    setBetError("Invalid odds data for fancy bet")
                    return
                }
                oddsValue = price.toFixed(2)
            }

            setSelectedBet({
                name: isMatchRunner(runner) ? runner.runner :
                    isFancyRunner(runner) ? (runner as FancyOdds).RunnerName :
                        isBookmakerRunner(runner) ? (runner as BookmakerRunner).runnerName : "",
                type: type.toUpperCase(),
                section: section.toUpperCase(),
                selectionId: isMatchRunner(runner) ? runner.selectionId :
                    isFancyRunner(runner) ? (runner as FancyOdds).RunnerName :
                        isBookmakerRunner(runner) ? (runner as BookmakerRunner).selectionId : undefined
            })
            setSelectedOdds(oddsValue)
            setSelectedStake("")
            if (isMobile) {
                setShowMobileBetForm(true)
            }
        } catch (error) {
            console.error("Error processing odds:", error)
            setBetError("Failed to process odds. Please try again.")
        }
    }

    const fetchOddsData = useCallback(async () => {
        if (!eventId || !marketId) {
            setError("Missing event or market ID in URL.")
            return
        }

        try {
            const [eventRes, fancyRes, bookmakerRes] = await Promise.all([
                fetch(`https://test.book2500.in/fetch-event-odds/${eventId}/${marketId}`).then((res) => res.json()),
                fetch(`https://test.book2500.in/fetch-fancy-odds/${eventId}/${marketId}`).then((res) => res.json()),
                fetch(`https://test.book2500.in/fetch-bookmaker-odds/${eventId}/${marketId}`).then((res) => res.json()),
            ])

            if (eventRes?.data) {
                setEventOdds({
                    eventName: eventRes.data.eventName || "",
                    runners: eventRes.data.runners || [],
                })
            }

            setFancyOdds(Array.isArray(fancyRes?.data) ? fancyRes.data : [])
            if (bookmakerRes?.data) {
                setBookmakerMarket(bookmakerRes.data)
            }
            setError(null)
        } catch (err) {
            console.error(err)
            setError("Failed to fetch odds data.")
        }
    }, [eventId, marketId])

    useEffect(() => {
        fetchOddsData()
        const interval = setInterval(fetchOddsData, 1000)
        return () => clearInterval(interval)
    }, [fetchOddsData])

    if (error)
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#2a1a47]">
                <div className="text-red-400 text-xl">{error}</div>
            </div>
        )

    // Extract team names from runners if available
    const team1 = eventOdds.runners?.[0]?.runner || "--"
    const team2 = eventOdds.runners?.[1]?.runner || "--"

    return (
        <div className="min-h-screen bg-[#2a1a47]">

            {/* Match Information */}
            <div className="bg-gradient-to-b from-[#3a2255] to-[#231439] p-4 border-b border-purple-800">
                <div className="container mx-auto">
                    <div className="text-white text-xl font-bold mb-2">
                        {team1} vs {team2}
                    </div>

                    {/* Toggle buttons */}
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant={showVideo ? "outline" : "default"}
                            onClick={() => setShowVideo(false)}
                            className={`${!showVideo ? "bg-yellow-400 text-black" : "text-yellow-400 border-yellow-400"}`}
                        >
                            Live Score
                        </Button>
                        <Button
                            variant={showVideo ? "default" : "outline"}
                            onClick={() => setShowVideo(true)}
                            className={`${showVideo ? "bg-yellow-400 text-black" : "text-yellow-400 border-yellow-400"}`}
                        >
                            Live Match
                        </Button>
                    </div>

                    {/* Live Score/Video Container */}
                    <div className="w-full h-[300px] md:h-[400px] bg-black/30 rounded-lg overflow-hidden mb-4">
                        {showVideo ? (
                            <VideoStream matchId={eventId || "333333"} />
                        ) : (
                            <iframe
                                ref={iframeRef}
                                src="https://www.satsports.net/score_widget/index.html?id=58145129"
                                className="w-full border-0 overflow-y-hidden"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                                allowFullScreen
                                style={{
                                    minHeight: "100px",

                                    display: "block",
                                    backgroundColor: "transparent",
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto">
                <div className="flex flex-col lg:flex-row">
                    {/* Match Sections */}
                    <div className="flex-1 pb-20 lg:pb-0">
                        {/* Match Odds Section */}
                        <div className="border-b border-purple-900">
                            <div
                                className="flex items-center justify-between bg-[#231439] p-3 cursor-pointer"
                                onClick={() => toggleSection("matchOdds")}
                            >
                                <div className="flex items-center">
                                    <div className="w-6 h-6 text-white flex items-center justify-center mr-2">★</div>
                                    <h2 className="text-white font-bold">MATCH ODDS</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">CASHOUT</div>
                                    <div className="text-white text-xs hidden sm:block">Min: 100 | Max: 250K</div>
                                    <div className="text-white">{expandedSections.matchOdds ? "▲" : "▼"}</div>
                                </div>
                            </div>

                            {expandedSections.matchOdds && (
                                <div className="p-0">
                                    <div className="grid grid-cols-2 w-full">
                                        <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                                            BACK
                                        </div>
                                        <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                                            LAY
                                        </div>
                                    </div>

                                    {eventOdds.runners?.map((runner, idx) => {
                                        const isSuspended = [0, 1, 2].some(index => {
                                            const backOdds = runner.ex?.availableToBack?.[index]?.price ?? 0;
                                            const layOdds = runner.ex?.availableToLay?.[index]?.price ?? 0;
                                            return backOdds <= 0 || layOdds <= 0;
                                        });

                                        return (
                                            <div key={idx} className="border-b border-purple-900">
                                                <div className="text-white font-bold pl-4 py-2 bg-[#231439]">{runner.runner}</div>
                                                <div className="grid grid-cols-6 w-full relative">
                                                    {isSuspended && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                                            <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
                                                        </div>
                                                    )}
                                                    {/* BACK columns (3) */}
                                                    {[2, 1, 0].map((i) => {
                                                        const odds = runner.ex?.availableToBack?.[i]?.price || 0
                                                        const size = runner.ex?.availableToBack?.[i]?.size || 0
                                                        const isAvailable = odds > 0 && !isSuspended

                                                        return (
                                                            <div
                                                                key={`back-${i}`}
                                                                onClick={() => isAvailable && handleOddsClick(runner, "back", "match")}
                                                                className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 ${isAvailable ? "cursor-pointer" : "opacity-90"} ${i === 0 ? "bg-[#72bbee]" : i === 1 ? "bg-[#72bbee] " : "bg-[#72bbee] "}`}
                                                            >
                                                                <div className="text-white font-bold">{odds > 0 ? odds.toFixed(2) : "0.0"}</div>
                                                                <div className="text-xs text-gray-200">{size > 0 ? size.toLocaleString() : "0.0"}</div>
                                                            </div>
                                                        )
                                                    })}

                                                    {/* LAY columns (3) */}
                                                    {[0, 1, 2].map((i) => {
                                                        const odds = runner.ex?.availableToLay?.[i]?.price || 0
                                                        const size = runner.ex?.availableToLay?.[i]?.size || 0
                                                        const isAvailable = odds > 0 && !isSuspended

                                                        return (
                                                            <div
                                                                key={`lay-${i}`}
                                                                onClick={() => isAvailable && handleOddsClick(runner, "lay", "match")}
                                                                className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 ${isAvailable ? "cursor-pointer" : "opacity-90"} ${i === 0 ? "bg-[#ff9393]" : i === 1 ? "bg-[#ff9393] " : "bg-[#ff9393]"}`}
                                                            >
                                                                <div className="text-white font-bold">{odds > 0 ? odds.toFixed(2) : "0.0"}</div>
                                                                <div className="text-xs text-gray-200">{size > 0 ? size.toLocaleString() : "0.0"}</div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Bookmaker Section */}
                        <div className="border-b border-purple-900">
                            <div
                                className="flex items-center justify-between bg-[#231439] p-3 cursor-pointer"
                                onClick={() => toggleSection("bookmaker")}
                            >
                                <div className="flex items-center">
                                    <div className="w-6 h-6 text-white flex items-center justify-center mr-2">★</div>
                                    <h2 className="text-white font-bold">BOOKMAKER</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">CASHOUT</div>
                                    <div className="text-white text-xs hidden sm:block">
                                        Min: {bookmakerMarket?.min || "100"} | Max: {bookmakerMarket?.max || "250K"}
                                    </div>
                                    <div className="text-white">{expandedSections.bookmaker ? "▲" : "▼"}</div>
                                </div>
                            </div>

                            {expandedSections.bookmaker && (
                                <div className="p-0">
                                    <div className="grid grid-cols-2 w-full">
                                        <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                                            BACK
                                        </div>
                                        <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                                            LAY
                                        </div>
                                    </div>

                                    {(bookmakerMarket?.runners || []).map((runner, idx) => {
                                        const isSuspended = runner.status === "SUSPENDED" || !runner.batb?.[0]?.[0] || !runner.batl?.[0]?.[0];

                                        return (
                                            <div key={idx} className="border-b border-purple-900">
                                                <div className="text-white font-bold pl-4 py-2 bg-[#231439]">
                                                    {runner.runnerName}
                                                </div>
                                                <div className="grid grid-cols-6 w-full relative">
                                                    {/* Back columns (3) */}
                                                    {[2, 1, 0].map((i) => (
                                                        <div
                                                            key={`back-${i}`}
                                                            onClick={() => !isSuspended && handleOddsClick(runner, "back", "bookmaker")}
                                                            className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 
                                                                ${!isSuspended ? "cursor-pointer" : "opacity-90"} bg-[#72bbee]`}
                                                        >
                                                            <div className="font-bold text-black">
                                                                {runner.batb?.[i]?.[0] || "0.0"}
                                                            </div>
                                                            <div className="text-[10px] text-black/75">
                                                                {(Number(runner.batb?.[i]?.[1] || 0) / 1000).toFixed(1)}K
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Lay columns (3) */}
                                                    {[0, 1, 2].map((i) => (
                                                        <div
                                                            key={`lay-${i}`}
                                                            onClick={() => !isSuspended && handleOddsClick(runner, "lay", "bookmaker")}
                                                            className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 
                                                                ${!isSuspended ? "cursor-pointer" : "opacity-90"} bg-[#ff9393]`}
                                                        >
                                                            <div className="font-bold text-black">
                                                                {runner.batl?.[i]?.[0] || "0.0"}
                                                            </div>
                                                            <div className="text-[10px] text-black/75">
                                                                {(Number(runner.batl?.[i]?.[1] || 0) / 1000).toFixed(1)}K
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {isSuspended && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                                            <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Fancy Section */}
                        <div className="border-b border-purple-900">
                            <div
                                className="flex items-center justify-between bg-[#231439] p-3 cursor-pointer"
                                onClick={() => toggleSection("fancy")}
                            >
                                <div className="flex items-center">
                                    <div className="w-6 h-6 text-white flex items-center justify-center mr-2">★</div>
                                    <h2 className="text-white font-bold">FANCY</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">CASHOUT</div>
                                    <div className="text-white text-xs hidden sm:block">Min: 100 | Max: 250K</div>
                                    <div className="text-white">{expandedSections.fancy ? "▲" : "▼"}</div>
                                </div>
                            </div>

                            {expandedSections.fancy && (
                                <div className="p-0">
                                    <div className="grid grid-cols-2 w-full">
                                        <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                                            NO
                                        </div>
                                        <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                                            YES
                                        </div>
                                    </div>

                                    {fancyOdds.map((odd, idx) => {
                                        const isSuspended = odd.BackPrice1 <= 0 || odd.LayPrice1 <= 0;

                                        return (
                                            <div key={idx} className="border-b border-purple-900 last:border-b-0">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-white font-bold pl-4 py-2 bg-[#231439] w-full">
                                                        {odd.RunnerName}
                                                        {odd.slidingText && <span className="text-xs text-gray-300 ml-2">{odd.slidingText}</span>}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 w-full relative">
                                                    {/* NO column */}
                                                    <div
                                                        onClick={() =>
                                                            !isSuspended &&
                                                            odd.BackPrice1 > 0 &&
                                                            handleOddsClick(
                                                                {
                                                                    ...odd,
                                                                    runner: odd.RunnerName // Add missing runner property
                                                                },
                                                                "no",
                                                                "fancy"
                                                            )
                                                        }
                                                        className={`flex flex-col items-center justify-center rounded p-2 text-center ${!isSuspended && odd.BackPrice1 > 0 ? "cursor-pointer bg-[#72bbee] mr-2" : "bg-[#72bbee]"
                                                            }`}
                                                    >
                                                        <div className="text-white font-bold">{odd.BackPrice1 > 0 ? odd.BackPrice1 : "0.0"}</div>
                                                        <div className="text-xs text-gray-200">
                                                            {odd.BackSize1 > 0 ? odd.BackSize1.toLocaleString() : "0.0"}
                                                        </div>
                                                    </div>

                                                    {/* YES column */}
                                                    <div
                                                        onClick={() =>
                                                            !isSuspended &&
                                                            odd.LayPrice1 > 0 &&
                                                            handleOddsClick(
                                                                {
                                                                    ...odd,
                                                                    runner: odd.RunnerName // Add missing runner property
                                                                },
                                                                "yes",
                                                                "fancy"
                                                            )
                                                        }
                                                        className={`flex flex-col items-center justify-center rounded p-2 text-center ${!isSuspended && odd.LayPrice1 > 0 ? "cursor-pointer bg-[#ff9393]" : "bg-[#ff9393]"
                                                            }`}
                                                    >
                                                        <div className="text-white font-bold">{odd.LayPrice1 > 0 ? odd.LayPrice1 : "0.0"}</div>
                                                        <div className="text-xs text-gray-200">
                                                            {odd.LaySize1 > 0 ? odd.LaySize1.toLocaleString() : "0.0"}
                                                        </div>
                                                    </div>

                                                    {/* Suspended overlay */}
                                                    {isSuspended && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                                            <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop Betting Panel - Always visible on large screens */}
                    <div className="hidden lg:block w-[350px] sticky top-0 h-screen">
                        <div className="h-full p-4 overflow-y-auto">
                            <div className="bg-gradient-to-br from-[#231439] via-[#2a1a47] to-[#231439] rounded-lg p-4 shadow-xl border border-purple-900">
                                {/* Betting Panel Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-white">
                                        <div className="font-bold text-lg">{eventOdds.eventName}</div>
                                        <div className="text-gray-300 text-sm">
                                            {selectedBet ? (
                                                <span>
                                                    {selectedBet.name} - {selectedBet.type} ({selectedBet.section})
                                                </span>
                                            ) : (
                                                "Select a bet"
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-gray-300 text-sm">Balance: ₹{userBalance}</div>
                                </div>

                                {/* Betting Form Content */}
                                <div className="space-y-4">
                                    <Input
                                        type="number"
                                        value={selectedOdds}
                                        onChange={(e) => setSelectedOdds(e.target.value)}
                                        className="bg-[#3a2255] text-white text-sm border-purple-900"
                                        placeholder="Odds"
                                    />
                                    <Input
                                        type="number"
                                        value={selectedStake}
                                        onChange={(e) => setSelectedStake(e.target.value)}
                                        className="bg-[#3a2255] text-white text-sm border-purple-900"
                                        placeholder="Stakes"
                                    />
                                    {/* Predefined Stakes Grid */}
                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                        {predefinedStakes[0].map((stake, index) => (
                                            <Button
                                                key={`stake-${index}`}
                                                onClick={() => handleStakeButton("predefined", stake)}
                                                className="bg-[#3a2255] hover:bg-[#4c2a70] text-white text-sm py-1"
                                            >
                                                {stake.toLocaleString()}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                        {predefinedStakes[1].map((stake, index) => (
                                            <Button
                                                key={`stake-${index}`}
                                                onClick={() => handleStakeButton("predefined", stake)}
                                                className="bg-[#3a2255] hover:bg-[#4c2a70] text-white text-sm py-1"
                                            >
                                                {stake.toLocaleString()}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleStakeButton("min")}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-black flex-1 text-sm"
                                        >
                                            MIN
                                        </Button>
                                        <Button
                                            onClick={() => handleStakeButton("max")}
                                            className="bg-green-600 hover:bg-green-700 text-white flex-1 text-sm"
                                        >
                                            MAX
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="default"
                                            className="bg-[#3a2255] text-white flex-1 text-sm"
                                            onClick={handleClearStake}
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="bg-green-600 text-white flex-1 text-sm"
                                            onClick={handlePlaceBet}
                                            disabled={!selectedBet || !selectedOdds || !selectedStake}
                                        >
                                            Place Bet
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Betting Panel */}
            {isMobile && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300"
                    style={{
                        transform: showMobileBetForm ? "translateY(0)" : "translateY(100%)",
                    }}
                >
                    <div className="bg-gradient-to-t from-[#231439] to-transparent p-2">
                        <div className="bg-[#2a1a47] rounded-t-lg p-4 shadow-xl border border-purple-900 border-b-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-white text-lg">{selectedBet?.name || "Select a bet"}</h3>
                                        <button
                                            onClick={() => {
                                                setShowMobileBetForm(false)
                                                setSelectedBet(null)
                                                handleClearStake()
                                            }}
                                            className="text-gray-400 hover:text-white p-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {selectedBet && (
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-white text-sm">
                                                {selectedBet.type} @ {selectedOdds}
                                            </p>
                                            <p className="text-white text-sm">Balance: ₹{Number.parseInt(userBalance).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    type="number"
                                    value={selectedOdds}
                                    readOnly
                                    className="w-full bg-[#3a2255] text-white border-0 rounded-lg text-lg h-12"
                                />

                                <Input
                                    type="number"
                                    value={selectedStake}
                                    onChange={(e) => setSelectedStake(e.target.value)}
                                    placeholder="Stakes"
                                    className="w-full bg-[#3a2255] text-white border-0 rounded-lg text-lg h-12"
                                />

                                <div className="grid grid-cols-4 gap-3">
                                    {predefinedStakes.flat().map((stake, index) => (
                                        <button
                                            key={index}
                                            className="bg-[#4c2a70] text-white py-3 px-2 rounded-lg text-sm font-medium hover:bg-[#5c3a80] transition-colors"
                                            onClick={() => handleStakeButton("predefined", stake)}
                                        >
                                            {stake.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        className="bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                                        onClick={() => handleStakeButton("min")}
                                    >
                                        MIN
                                    </button>
                                    <button
                                        className="bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                        onClick={() => handleStakeButton("max")}
                                    >
                                        MAX
                                    </button>
                                </div>

                                {betError && <p className="text-red-500 text-sm text-center">{betError}</p>}

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        className="bg-[#3a2255] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#4c2a70] transition-colors"
                                        onClick={handleClearStake}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        className="bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handlePlaceBet}
                                        disabled={!selectedStake || Number(selectedStake) < MIN_STAKE || Number(selectedStake) > MAX_STAKE}
                                    >
                                        Place Bet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bet Button */}
            {isMobile && selectedBet && !showMobileBetForm && (
                <div className="fixed bottom-4 right-4 z-40">
                    <Button
                        onClick={() => setShowMobileBetForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg"
                    >
                        <span className="text-2xl">+</span>
                    </Button>
                </div>
            )}
        </div>
    )
}
