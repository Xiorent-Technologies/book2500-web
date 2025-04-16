/* eslint-disable @typescript-eslint/no-unused-vars */
interface LiveMatchData {
    eventId: string;
    tv: string;
    iframeScore: string;
}

async function fetchLiveMatchData(matchId: string) {
    try {
        const response = await fetch(`https://tvapp.1ten.live/api/get-all-tv`)
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

type PageProps = {
    params: Promise<{ matchId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }> | undefined
}

export default async function EmbedLiveMatch(props: PageProps) {
    // Wait for params to be resolved
    const params = await props.params;
    const searchParams = await props.searchParams;

    // Fetch data using resolved params
    const [matchData, scoreWidgetId] = await Promise.all([
        fetchLiveMatchData(params.matchId),
        Promise.resolve(getScoreWidgetId(params.matchId))
    ]);

    return (
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #000;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100vw;
          }
          .video {
            flex: 1;
            min-height: 300px;
            background: #111;
          }
          .score {
            height: 55px;
            background: #111;
          }
          iframe {
            border: 0;
            width: 100%;
            height: 100%;
          }
          .error {
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            padding: 20px;
          }
        `}</style>
            </head>
            <body>
                <div className="container">
                    <div className="video">
                        {matchData?.tv ? (
                            <iframe
                                src={matchData.tv}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
                            />
                        ) : (
                            <div className="error">Live video not available</div>
                        )}
                    </div>
                    <div className="score">
                        <iframe
                            src={matchData?.iframeScore || `https://www.satsports.net/score_widget/index.html?id=${scoreWidgetId}`}
                            scrolling="no"
                        />
                    </div>
                </div>
            </body>
        </html>
    )
}
