interface LiveMatchData {
    eventId: string;
    tv: string;
    iframeScore: string;
}

async function fetchMatchData(eventId: string) {
    try {
        const response = await fetch('https://tvapp.1ten.live/api/get-all-tv', { cache: 'no-store' })
        const data: LiveMatchData[] = await response.json()
        return data.find(match => match.eventId === eventId)
    } catch (error) {
        console.error('Error fetching match data:', error)
        return null
    }
}

export default async function EmbedPage({
    params
}: {
    params: { eventId: string }
}) {
    const matchData = await fetchMatchData(params.eventId)

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Video Container */}
            <div className="flex-1 min-h-[300px]">
                {matchData?.tv ? (
                    <iframe
                        src={matchData.tv}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
                        allowFullScreen
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Live video not available
                    </div>
                )}
            </div>

            {/* Score Container */}
            <div className="h-[55px]">
                {matchData?.iframeScore && (
                    <iframe
                        src={matchData.iframeScore}
                        className="w-full h-full border-0"
                        scrolling="no"
                    />
                )}
            </div>
        </div>
    )
}
