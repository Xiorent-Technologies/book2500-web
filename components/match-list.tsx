/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tv } from "lucide-react";
import Link from "next/link";

interface Runner {
  selectionId?: number;
  runner: string;
  ex: {
    availableToBack: Array<{ price: number; size: number }>;
    availableToLay: Array<{ price: number; size: number }>;
  };
}

interface EventData {
  event: {
    id: string;
    name: string;
    openDate: string;
    countryCode: string;
  };
  marketCount: number;
  marketIds: Array<{
    marketId: string;
    marketName: string;
    totalMatched: string;
  }>;
  matchOdds?: Array<{
    runner: string;
    back: Array<{ level: number; price: number; size: number }>;
    lay: Array<{ level: number; price: number; size: number }>;
  }>;
  odds?: {
    eventName: string;
    runners: Runner[];
  };
  badges?: string[];
}

// Helper to check if a match is live
function isMatchLive(matchStartTime: string): boolean {
  const now = new Date();
  const matchTime = new Date(matchStartTime);
  const hoursDifference = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);
  return hoursDifference >= 0 && hoursDifference <= 8;
}

export function MatchList() {
  const [matches, setMatches] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchcalculations = useCallback(async (eventId: string, marketId: string) => {
    try {
      await fetch(`https://test.book2500.in/api/bet/bet-options/${eventId}/${marketId}`);
    } catch (error) {
      console.error("Error fetching bet history:", error);
    } finally {
      // setLoading(false);
    }
  }, []);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("https://test.book2500.in/api/event/fetch-event-with-odds");
        const json = await response.json();
        const data: EventData[] = json.data || [];

        const processedMatches = data.slice(0, 5).map((match, index) => {
          // Convert match.matchOdds into match.odds.runners
          const runners: Runner[] = (match.matchOdds || []).map((oddsEntry) => ({
            runner: oddsEntry.runner,
            ex: {
              availableToBack: oddsEntry.back.map((b) => ({
                price: b.price,
                size: b.size,
              })),
              availableToLay: oddsEntry.lay.map((l) => ({
                price: l.price,
                size: l.size,
              })),
            },
          }));

          const badges = ["F"];
          if (index >= 1 && index <= 3) {
            badges.unshift("BM");
          }

          return {
            ...match,
            odds: { eventName: match.event.name, runners },
            badges,
          };
        });

        setMatches(processedMatches);
        setError(null);
      } catch (err) {
        console.error("Error fetching matches", err);
        setError("Failed to fetch matches");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 1700);
    return () => clearInterval(interval);
  }, []);

  const getFormattedOdds = (runners: Runner[]) => {
    if (!runners || runners.length < 2) return null;

    const team1 = runners[0];
    const team2 = runners[1];

    return {
      team1Back1: team1.ex.availableToBack[0]?.price ?? "-",
      team1Lay1: team1.ex.availableToLay[0]?.price ?? "-",
      team1Back2: team1.ex.availableToBack[1]?.price ?? "-",
      team1Lay2: team1.ex.availableToLay[1]?.price ?? "-",
      team2Back1: team2.ex.availableToBack[0]?.price ?? "-",
      team2Lay1: team2.ex.availableToLay[0]?.price ?? "-",
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b border-purple-900 p-4">
            <div className="h-6 bg-purple-800/50 rounded animate-pulse mb-2 w-3/4"></div>
            <div className="h-4 bg-purple-800/50 rounded animate-pulse mb-4 w-1/2"></div>
            <div className="grid grid-cols-6 gap-2">
              {Array(6)
                .fill(0)
                .map((_, idx) => (
                  <div
                    key={idx}
                    className="h-10 bg-purple-800/50 rounded animate-pulse"
                  ></div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">{error}</div>;
  }

  if (matches.length === 0) {
    return <div className="p-4 text-center text-gray-400">No matches available</div>;
  }

  return (
    <div className="flex flex-col">
      {matches.map((match) => (
        <Link
          key={match.event.id}
          href={`/cricket/live?match=${match.event.id}&market=${match.marketIds[0]?.marketId}`}
          onClick={() => { fetchcalculations(match.event.id, match.marketIds[0]?.marketId) }}
          className="block border-b border-purple-900 hover:bg-[#3a2255] transition-colors"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-gray-400 text-sm">
                  {new Date(match.event.openDate).toLocaleString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
                <div className="text-white font-medium">{match.event.name}</div>
              </div>
              <div className="flex items-center gap-2">
                {isMatchLive(match.event.openDate) && (
                  <Badge className="bg-red-500 text-white">LIVE</Badge>
                )}
                {match.badges?.includes("BM") && (
                  <Badge className="bg-green-500 text-white">BM</Badge>
                )}
                {match.badges?.includes("F") && (
                  <Badge className="bg-yellow-500 text-black">F</Badge>
                )}
                <div className="bg-yellow-400 p-1 rounded">
                  <Tv size={16} className="text-black" />
                </div>
              </div>
            </div>

            <div className="p-1 rounded overflow-hidden text-xs">
              {!match.odds?.runners ? (
                <div className="grid grid-cols-6 gap-2">
                  {Array(6).fill(null).map((_, index) => (
                    <div
                      key={index}
                      className={`rounded py-4 text-center ${index % 2 === 0 ? "bg-[#72bbee]" : "bg-[#ff9393]"
                        }`}
                    >
                      <div className="font-bold text-black">-</div>
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  const odds: any = getFormattedOdds(match.odds.runners);
                  if (!odds) return null;

                  const isSuspended = Object.values(odds).every((odd: any) => odd === "-");

                  return (
                    <div
                      className={`grid grid-cols-6 gap-2 relative ${isSuspended ? "opacity-80" : ""
                        }`}
                    >
                      <div className="bg-[#72bbee] rounded py-4 text-center">
                        <div className="font-bold text-black">
                          {odds.team1Back1 === "-" ? "0.0" : Number(odds.team1Back1).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#ff9393] rounded py-4 text-center">
                        <div className="font-bold text-black">
                          {odds.team1Lay1 === "-" ? "0.0" : Number(odds.team1Lay1).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#72bbee] rounded py-4 text-center">
                        <div className="font-bold text-black">
                          {odds.team1Back2 === "-" ? "0.0" : Number(odds.team1Back2).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#ff9393] rounded py-4 text-center">
                        <div className="font-bold text-black">
                          {odds.team1Lay2 === "-" ? "0.0" : Number(odds.team1Lay2).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#72bbee] rounded py-4 text-center">
                        <div className="font-bold text-black">
                          {odds.team2Back1 === "-" ? "0.0" : Number(odds.team2Back1).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#ff9393] rounded py-4 text-center">
                        <div className="font-bold text-black">
                          {odds.team2Lay1 === "-" ? "0.0" : Number(odds.team2Lay1).toFixed(2)}
                        </div>
                      </div>
                      {isSuspended && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
