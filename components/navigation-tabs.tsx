"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function NavigationTabs() {
    const [activeTab, setActiveTab] = useState("SLOTS")

    const tabs = ["SLOTS", "LIVE CASINO", "INSTANT", "TABLE GAMES"]

    return (
        <div className="w-full bg-[#2a1a47] border-t border-b border-purple-900 sticky top-0 z-10">
            <div className="flex justify-between items-center max-w-screen-xl mx-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={cn(
                            "py-4 px-2 text-white font-bold text-[12px] md:text-lg flex-1 text-center",
                            activeTab === tab ? "text-white" : "text-gray-300",
                        )}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    )
}
