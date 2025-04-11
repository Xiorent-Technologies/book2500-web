import { Suspense } from "react"
import LiveMatch from "./components/live-match"


export default function LiveMatchPage() {
    return (
        <Suspense
            fallback={<div className="min-h-screen bg-[#2a1a47] flex items-center justify-center text-white">Loading...</div>}
        >
            <LiveMatch />
        </Suspense>
    )
}
