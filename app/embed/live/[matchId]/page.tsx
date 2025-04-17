interface LiveMatchData {
    eventId: string;
    tv: string;
    iframeScore: string;
}

async function fetchLiveMatchData(matchId: string) {
    try {
        // Add console.log to debug the matchId
        console.log("Fetching data for matchId:", matchId);

        const response = await fetch('https://tvapp.1ten.live/api/get-all-tv', {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data: LiveMatchData[] = await response.json();
        console.log("Received data:", data);

        // Clean up the matchId by removing any path segments
        const cleanMatchId = matchId.split('match=').pop() || matchId;
        console.log("Clean matchId:", cleanMatchId);

        return data.find(match => match.eventId === cleanMatchId);
    } catch (error) {
        console.error('Error fetching match data:', error);
        return null;
    }
}

export default async function LiveMatchEmbed({
    params
}: {
    params: { matchId: string }
}) {
    // Extract just the ID number from any format
    const cleanMatchId = params.matchId.includes('match=')
        ? params.matchId.split('match=')[1]
        : params.matchId;

    const matchData = await fetchLiveMatchData(cleanMatchId);

    if (!matchData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                Match not found
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Video Container */}
            <div className="flex-1 min-h-[300px]">
                {matchData.tv ? (
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
                {matchData.iframeScore && (
                    <iframe
                        src={matchData.iframeScore}
                        className="w-full h-full border-0"
                        scrolling="no"
                    />
                )}
            </div>
        </div>
    );
}
