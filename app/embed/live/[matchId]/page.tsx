interface LiveMatchData {
  eventId: string;
  tv: string;
  iframeScoreV1: string;
}

async function fetchLiveMatchData(matchId: string) {
  try {
    const response = await fetch("https://tvapp.1ten.live/api/get-all-tv", {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    const data: LiveMatchData[] = await response.json();
    return data.find((match) => match.eventId === matchId);
  } catch (error) {
    console.error("Error fetching match data:", error);
    return null;
  }
}

export default async function LiveMatchEmbed({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  // Wait for params to be available
  const resolvedParams = await params;

  // Extract match ID from the resolved params
  const cleanMatchId = resolvedParams.matchId.includes("match=")
    ? resolvedParams.matchId.split("match=")[1]
    : resolvedParams.matchId;

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
      <div className="h-[124px]">
        {matchData.iframeScoreV1 && (
          <iframe
            src={matchData.iframeScoreV1}
            className="w-full h-full border-0"
            scrolling="no"
          />
        )}
      </div>
    </div>
  );
}
