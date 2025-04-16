import { NextResponse } from "next/server"

interface LiveMatchData {
    eventId: string;
    tv: string;
    iframeScore: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get("match")

        const response = await fetch("https://tvapp.1ten.live/api/get-all-tv")
        const data: LiveMatchData[] = await response.json()

        const matchData = data.find(match => match.eventId === eventId)

        return NextResponse.json({
            success: true,
            data: {
                videoUrl: matchData?.tv || null,
                scoreUrl: matchData?.iframeScore || `https://www.satsports.net/score_widget/index.html?id=${getScoreWidgetId(eventId)}`
            }
        })
    } catch {
        return NextResponse.json({
            success: false,
            message: "Failed to fetch stream data"
        }, { status: 500 })
    }
}

// Helper function
function getScoreWidgetId(matchId: string | null): number {
    const BASE_ID = 58145141
    if (!matchId) return BASE_ID
    const matchNum = parseInt(matchId.replace(/\D/g, '')) % 10
    return BASE_ID + (matchNum * 2)
}
