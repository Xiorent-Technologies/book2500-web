"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { MatchList } from "./match-list"
// import { MatchList } from "./match-list"

export function CricketSection() {
    const [expanded, setExpanded] = useState(true)

    return (
        <div className="w-full bg-[#231439] mb-20">
            <div className="flex items-center justify-between p-4 border-b border-purple-900">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white font-bold">🏏</span>
                    </div>
                    <span className="text-white font-bold text-xl">CRICKET</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#3a2255] rounded-full px-6 py-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-white font-bold">LIVE</span>
                    </div>
                    <button className="text-white" onClick={() => setExpanded(!expanded)}>
                        <ChevronDown className={`transform transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div>
                    <div className="flex justify-between items-center p-4 border-b border-purple-900">
                        <span className="text-white text-lg">Matches</span>
                        <div className="flex gap-4">
                            <button className="text-blue-400 font-bold">BACK</button>
                            <button className="text-pink-500 font-bold">LAY</button>
                        </div>
                    </div>

                    <MatchList />
                </div>
            )}
        </div>
    )
}
