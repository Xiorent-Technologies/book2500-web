const getScoreWidgetId = (matchId: string): number => {
    const BASE_ID = 58145141
    const matchNum = parseInt(matchId.replace(/\D/g, '')) % 10
    return BASE_ID + (matchNum * 2)
}

export default function CombinedViewPage({ params }: { params: { matchId: string } }) {
    const matchId = params.matchId;
    const scoreWidgetId = getScoreWidgetId(matchId);

    return (
        <div className="flex flex-col h-screen bg-black">
            <div className="flex-1 min-h-[300px]">
                <iframe
                    src={`https://tvapp.1ten.live/embed/live-match/${matchId}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
                />
            </div>
            <div className="h-[55px]">
                <iframe
                    src={`https://www.satsports.net/score_widget/index.html?id=${scoreWidgetId}`}
                    className="w-full h-full border-0"
                    scrolling="no"
                />
            </div>
        </div>
    );
}
