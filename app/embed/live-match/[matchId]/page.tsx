

interface LiveMatchData {
    eventId: string;
    tv: string;
    iframeScore: string;
}

async function fetchLiveMatchData(matchId: string) {
    try {
        const response = await fetch(`https://tvapp.1ten.live/api/get-all-tv`, { cache: 'no-store' })
        const data: LiveMatchData[] = await response.json()
        return data.find(match => match.eventId === matchId)
    } catch (error) {
        console.error('Error fetching match data:', error)
        return null
    }
}

const getScoreWidgetId = (matchId: string): number => {
    const BASE_ID = 58145141
    const matchNum = parseInt(matchId.replace(/\D/g, '')) % 10
    return BASE_ID + (matchNum * 2)
}

export default async function EmbedLiveMatch(props: {
    params: Promise<{ matchId: string }>
}) {
    // First await the params
    const params = await props.params;
    const matchId = params.matchId;

    // Then use the matchId in parallel operations
    const [match, score] = await Promise.all([
        fetchLiveMatchData(matchId),
        Promise.resolve(getScoreWidgetId(matchId))
    ]);

    return (
        <div className="min-h-screen bg-black">
            <div className="embed-container">
                <div className="video-container">
                    {match?.tv ? (
                        <iframe
                            src={match.tv}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
                        />
                    ) : (
                        <div className="error-message">Live video not available</div>
                    )}
                </div>
                <div className="score-container">
                    <iframe
                        src={match?.iframeScore || `https://www.satsports.net/score_widget/index.html?id=${score}`}
                        scrolling="no"
                    />
                </div>
            </div>
        </div>
    )
}