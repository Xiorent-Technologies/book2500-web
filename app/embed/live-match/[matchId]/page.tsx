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


export default async function EmbedLiveMatch(props: {
    params: Promise<{ matchId: string }>
}) {
    const params = await props.params;
    const matchId = params.matchId;
    const match = await fetchLiveMatchData(matchId);

    // Combine both video and score into a single page
    return (
        <div className="min-h-screen bg-black">
            <iframe
                src={`http://book2500.com/combined-view/${match}`}
                className="w-full h-screen border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
            />
        </div>
    );
}