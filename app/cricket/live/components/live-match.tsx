/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateBalanceFromAPI } from "@/lib/utils";
import { executeCashout } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EventOdd } from "@/lib/types/odds";

const MIN_STAKE = 100;
const MAX_STAKE = 250000;

// Add this constant for predefined stakes
const PREDEFINED_STAKES = {
  low: [100, 500, 1000, 2000],
  high: [5000, 10000, 25000, 50000],
} as const;

const isBrowser = typeof window !== "undefined";

interface Runner {
  Option_id: number;
  Question_id: number;
  selectionId: string; // Changed from number | string to just string
  runner: string;
  ex?: {
    availableToBack?: Array<{ price: number; size: number }>;
    availableToLay?: Array<{ price: number; size: number }>;
  };
}

interface SelectedBet {
  name: string;
  type: string;
  section: string;
  selectionId?: string; // Changed from string | number to just string
  betoption_id: number;
  betquestion_id: number;
  match_id: number;
  level?: number; // Add level for bookmaker bets
}

interface BookmakerMarket {
  marketId: string;
  evid: string;
  inplay: boolean;
  isMarketDataDelayed: boolean;
  status: string;
  provider: string;
  betDelay: number;
  bspReconciled: boolean;
  complete: boolean;
  numberOfWinners: number;
  numberOfRunners: number;
  numberOfActiveRunners: number;
  lastMatchTime: string;
  totalMatched: number;
  totalAvailable: number;
  crossMatching: boolean;
  runnersVoidable: boolean;
  version: number;
  runners: BookmakerRunner[];
  min: string;
  max: string;
  mname: string;
  rem: string;
}

interface BookmakerRunner {
  selectionId: string; // Changed from number to string
  runnerName: string;
  handicap: number;
  status: string;
  lastPriceTraded: number;
  totalMatched: number;
  back: Array<{
    price1: number;
    price: number;
    size: string;
  }>;
  lay: Array<{
    price1: number;
    price: number;
    size: string;
  }>;
  ex: {
    availableToBack: Array<{
      price: number;
      size: string;
      price1: number;
    }>;
    availableToLay: Array<{
      price: number;
      size: string;
      price1: number;
    }>;
  };
}

interface FancyOdds extends BetItem {
  RunnerName: string;
  BackPrice1: number;
  BackSize1: number;
  LayPrice1: number;
  LaySize1: number;
  isSuspended?: boolean;
  slidingText?: string;
}

interface BetItem extends Runner {
  batb?: [number, number][];
  batl?: [number, number][];
  BackPrice1?: number;
  LayPrice1?: number;
  BackSize1?: number;
  LaySize1?: number;
  RunnerName?: string;
  runnerName?: string;
  isSuspended?: boolean;
  SelectionId?: number | string;
}

interface LiveMatchData {
  eventId: string;
  tv: string;
  iframeScore: string;
  isLive?: boolean;
}

interface FancyOddsMapping {
  RunnerName: string;
  Match_id: string;
  Question_id: number;
  Option_id: number;
  Option_name: string;
  SelectionId: string;
  min: string;
  max: string;
}

interface FancyOddApiData {
  RunnerName: string;
  Match_id: number;
  Question_id: number;
  Option_id: number;
  Option_name: string;
  SelectionId: string;
  min: string;
  max: string;
}

interface FancyOddsResponse {
  RunnerName: string;
  LayPrice1: number;
  LaySize1: number;
  BackPrice1: number;
  BackSize1: number;
  SelectionId: string;
  GameStatus: string;
  min: string;
  max: string;
}

interface InitialFancyData {
  RunnerName: string;
  SelectionId: string;
  Question_id: number;
  Option_id: number;
}

interface EventOddsResponse {
  message: string;
  success: boolean;
  data: Array<{
    RunnerName: string;
    Match_id: number;
    Question_id: number;
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
  }>;
}

interface EventOddApiData {
  RunnerName: string;
  Match_id: number;
  Question_id: number;
  Option_id: number;
  Option_name: string;
  SelectionId: string;
  min: string;
  max: string;
}

interface CashoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profitLoss?: {
    selectedTeam: string;
    otherTeam: string;
    selectedTeamAmount: number;
    otherTeamAmount: number;
    section: string;
  };
}

interface PredictionData {
  RunnerName: string;
  Match_id: number;
  Question_id: number;
  Option_id: number;
  Option_name: string;
  SelectionId: string;
}

interface OddsMapping {
  [key: string]: PredictionData;
}

interface GroupedFancyOdds {
  questionId: number;
  runnerName: string;
  back: FancyOddsMapping;
  lay: FancyOddsMapping;
}

interface RealTimeFancyOdds {
  RunnerName: string;
  LayPrice1: number;
  LaySize1: number;
  BackPrice1: number;
  BackSize1: number;
  SelectionId: string;
  GameStatus: string;
  min: string;
  max: string;
}

interface GroupedFancyOdd {
  RunnerName: string;
  Match_id: string;
  Question_id: number;
  back: {
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
    price: number;
    size: number;
  } | null;
  lay: {
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
    price: number;
    size: number;
  } | null;
}

interface FancyApiMapping {
  RunnerName: string;
  Match_id: string;
  Question_id: number;
  Option_id: number;
  Option_name: string;
  SelectionId: string;
  min: string;
  max: string;
}

interface RealTimeRunner {
  selectionId: string;
  ex?: {
    availableToBack: Array<{ price: number; size: number }>;
    availableToLay: Array<{ price: number; size: number }>;
  };
}

interface RealTimeOdds {
  data: {
    runners: RealTimeRunner[];
  };
}

interface RealTimeFancyOdd {
  RunnerName: string;
  LayPrice1: number;
  LaySize1: number;
  BackPrice1: number;
  BackSize1: number;
  GameStatus: string;
  SelectionId: string;
  min: string;
  max: string;
  gtype: string;
  rem: string;
}

interface BookmakerMapping {
  RunnerName: string;
  Match_id: string;
  Question_id: number;
  Option_id: number;
  Option_name: string;
  SelectionId: string;
}

interface CashoutData {
  bet_invest_id: string;
  base0: string; // on which we are betting ratio
  base1: string; // opposite of placed bet ratio
}

interface BetLog {
  id: string;
  status: string;
  invest_amount: string;
  ratio: string;
  selection_id: string;
  isback: number;
  level: number;
  section: string; // "MATCH" or "BOOKMAKER"
  created_at: string;
}

interface BetMap {
  profit: number;
  liability: number;
  isBack: boolean;
  created_at?: string;
}

function CashoutDialog({
  isOpen,
  onClose,
  onConfirm,
  profitLoss,
}: CashoutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2D1A4A] border border-purple-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Confirm {profitLoss?.section} Cashout
          </DialogTitle>
          <DialogDescription>
            <span className="text-gray-300 block mb-4">
              Do you want to proceed with the cashout?
            </span>
            {profitLoss && (
              <div className="bg-[#3a2255] rounded-lg p-4 border border-purple-900">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">
                    {profitLoss.selectedTeam}
                  </span>
                  <span
                    className={`font-medium ${
                      profitLoss.selectedTeamAmount > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {profitLoss.selectedTeamAmount > 0 ? "+" : ""}₹
                    {Math.abs(profitLoss.selectedTeamAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300">{profitLoss.otherTeam}</span>
                  <span
                    className={`font-medium ${
                      profitLoss.otherTeamAmount > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {profitLoss.otherTeamAmount > 0 ? "+" : ""}₹
                    {Math.abs(profitLoss.otherTeamAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-purple-500 text-white hover:bg-purple-900"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Confirm Cashout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LiveMatch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("match");
  const marketId = searchParams.get("market");

  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [selectedOdds, setSelectedOdds] = useState("");
  const [selectedStake, setSelectedStake] = useState("");
  const [eventOdds, setEventOdds] = useState<{
    eventName: string;
    marketId?: string;
    runners: Runner[];
  }>({ eventName: "", marketId: "", runners: [] });
  const [fancyOdds, setFancyOdds] = useState<FancyOdds[]>([]);
  const [bookmakerMarket, setBookmakerMarket] =
    useState<BookmakerMarket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [betError, setBetError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [showMobileBetForm, setShowMobileBetForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [liveMatchData, setLiveMatchData] = useState<LiveMatchData | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState({
    matchOdds: true,
    bookmaker: true,
    fancy: true,
  });
  const [isMatchLive, setIsMatchLive] = useState(false);
  const [fancyOddsMappings, setFancyOddsMappings] = useState<GroupedFancyOdd[]>(
    []
  );
  const [fancyApiData, setFancyApiData] = useState<FancyOddApiData[]>([]);
  const [initialOdds, setInitialOdds] = useState<EventOddsResponse["data"]>([]);
  const [matchApiData, setMatchApiData] = useState<EventOddApiData[]>([]);
  const [showCashoutDialog, setShowCashoutDialog] = useState(false);
  const [cashoutType, setCashoutType] = useState<string>("");
  const [cashoutSelectionId, setCashoutSelectionId] = useState<string>("");
  const [groupedFancyOdds, setGroupedFancyOdds] = useState<GroupedFancyOdds[]>(
    []
  );
  const [bookmakerMappings, setBookmakerMappings] = useState<
    BookmakerMapping[]
  >([]);
  const [cashoutProfitLoss, setCashoutProfitLoss] = useState<{
    selectedTeam: string;
    otherTeam: string;
    selectedTeamAmount: number;
    otherTeamAmount: number;
    section: string;
  } | null>(null);
  const [recentBets, setRecentBets] = useState<BetLog[]>([]);
  const [profitLossMap, setProfitLossMap] = useState<{ [key: string]: number }>(
    {}
  );
  const [betMaps, setBetMaps] = useState<{
    [key: string]: {
      amount: number;
      isBack: boolean;
      created_at?: string;
    };
  }>({});

  const calculateProfitLoss = useCallback(() => {
    if (!selectedOdds || !selectedStake) return {};

    const stake = Number(selectedStake);
    const odds = Number(selectedOdds);

    if (isNaN(stake) || isNaN(odds)) return {};

    const profitLossMap: { [key: string]: number } = {};

    // For Match Odds and Bookmaker
    eventOdds.runners.forEach((runner) => {
      if (selectedBet && runner.selectionId === selectedBet.selectionId) {
        // This is the selected runner - calculate potential profit
        profitLossMap[runner.selectionId] = stake * odds - stake;
      } else {
        // This is the opposing runner - will lose stake amount
        profitLossMap[runner.selectionId] = -stake;
      }
    });

    return profitLossMap;
  }, [selectedOdds, selectedStake, selectedBet, eventOdds.runners]);

  const handleFancyOddsUpdate = useCallback(
    (realtimeOdds: RealTimeFancyOdds[]) => {
      setFancyOdds((prevOdds) => {
        return prevOdds.map((odd) => {
          const updatedOdd = realtimeOdds.find(
            (realOdd) => realOdd.RunnerName === odd.RunnerName
          );

          if (updatedOdd) {
            return {
              ...odd,
              BackPrice1: updatedOdd.BackPrice1 || 0,
              BackSize1: updatedOdd.BackSize1 || 0,
              LayPrice1: updatedOdd.LayPrice1 || 0,
              LaySize1: updatedOdd.LaySize1 || 0,
              isSuspended:
                !updatedOdd.BackPrice1 ||
                !updatedOdd.LayPrice1 ||
                updatedOdd.GameStatus === "SUSPENDED",
            };
          }
          return odd;
        });
      });
    },
    []
  );

  useEffect(() => {
    if (isBrowser) {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData.balance) {
          setUserBalance(parsedData.balance);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    const balanceInterval = setInterval(async () => {
      try {
        const newBalance = await updateBalanceFromAPI();
        if (newBalance) {
          setUserBalance(newBalance);
        }
      } catch (error) {
        console.error("Error in balance interval:", error);
      }
    }, 10000);

    return () => clearInterval(balanceInterval);
  }, []);

  useEffect(() => {
    const fetchLiveMatchData = async () => {
      if (!eventId) return;

      try {
        const response = await fetch("https://tvapp.1ten.live/api/get-all-tv", {
          cache: "no-store",
        });
        const data: LiveMatchData[] = await response.json();
        const matchData = data.find((match) => match.eventId === eventId);
        // console.log(matchData);
        setLiveMatchData(matchData || null);

        setIsMatchLive(!!matchData?.tv);
      } catch (error) {
        console.error("Error fetching live match data:", error);
      }
    };

    fetchLiveMatchData();
    const interval = setInterval(fetchLiveMatchData, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    const fetchInitialEventOdds = async () => {
      if (!eventId || !marketId) return;

      try {
        const response = await fetch(
          "https://book2500.funzip.in/api/event-odds",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: eventId, market_id: marketId }),
          }
        );

        const data = await response.json();

        // if (data.data) {
        // Create a mapping of SelectionId to prediction data
        const oddsMapping: OddsMapping = {};
        data.data.forEach((odd: PredictionData) => {
          oddsMapping[odd.SelectionId] = odd;
        });

        // Store the mapping for later use
        setMatchApiData(data.data);

        setEventOdds({
          eventName: data.data[0]?.RunnerName || "",
          marketId: marketId,
          runners: data.data.map((odd) => ({
            selectionId: odd.SelectionId,
            runner: odd.Option_name,
            Option_id: odd.Option_id,
            Question_id: odd.Question_id,
            Match_id: odd.Match_id,
            ex: {
              availableToBack: [{ price: 0, size: 0 }],
              availableToLay: [{ price: 0, size: 0 }],
            },
          })),
        });
        // }
      } catch (error) {
        console.error("Error fetching initial odds:", error);
        setError("Failed to load initial odds data");
      }
    };

    fetchInitialEventOdds();
  }, [eventId, marketId]);

  const fetchOddsData = useCallback(async () => {
    if (!eventId || !marketId || !eventOdds.runners.length) return;

    try {
      const response = await fetch(
        `https://test.book2500.in/fetch-event-odds/${eventId}/${marketId}`
      );
      const data: RealTimeOdds = await response.json();

      if (data?.data?.runners) {
        setEventOdds((prev) => ({
          ...prev,
          runners: prev.runners.map((runner) => {
            const realtimeRunner = data.data.runners.find(
              (r) => String(r.selectionId) === String(runner.selectionId)
            );

            if (!realtimeRunner?.ex) return runner;

            return {
              ...runner,
              ex: {
                availableToBack: realtimeRunner.ex.availableToBack || [
                  { price: 0, size: 0 },
                  { price: 0, size: 0 },
                  { price: 0, size: 0 },
                ],
                availableToLay: realtimeRunner.ex.availableToLay || [
                  { price: 0, size: 0 },
                  { price: 0, size: 0 },
                  { price: 0, size: 0 },
                ],
              },
            };
          }),
        }));
      }
    } catch (err) {
      console.error("Error fetching real-time odds:", err);
    }
  }, [eventId, marketId, eventOdds.runners.length]);

  useEffect(() => {
    // Initial fetch
    fetchOddsData();

    // Set up polling interval
    const interval = setInterval(fetchOddsData, 1200);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchOddsData]);

  useEffect(() => {
    const fetchInitialFancyOdds = async () => {
      if (!eventId || !marketId) return;

      try {
        const response = await fetch(
          "https://book2500.funzip.in/api/fancy-odds",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              event_id: eventId,
              market_id: marketId,
            }),
          }
        );

        const data = await response.json();

        // Add null check and default to empty array if data.data is undefined
        if (data && Array.isArray(data.data)) {
          // Group odds by RunnerName
          const groupedOdds = data.data.reduce(
            (
              acc: { [key: string]: GroupedFancyOdd },
              curr: FancyApiMapping
            ) => {
              const key = `${curr.Question_id}-${curr.RunnerName}`;

              if (!acc[key]) {
                acc[key] = {
                  RunnerName: curr.RunnerName,
                  Match_id: curr.Match_id,
                  Question_id: curr.Question_id,
                  back: null,
                  lay: null,
                };
              }

              if (curr.Option_name.toLowerCase() === "back") {
                acc[key].back = {
                  Option_id: curr.Option_id,
                  Option_name: curr.Option_name,
                  SelectionId: curr.SelectionId,
                  min: curr.min,
                  max: curr.max,
                  price: 0,
                  size: 0,
                };
              } else if (curr.Option_name.toLowerCase() === "lay") {
                acc[key].lay = {
                  Option_id: curr.Option_id,
                  Option_name: curr.Option_name,
                  SelectionId: curr.SelectionId,
                  min: curr.min,
                  max: curr.max,
                  price: 0,
                  size: 0,
                };
              }

              return acc;
            },
            {}
          );

          setFancyOddsMappings(Object.values(groupedOdds));
        } else {
          console.warn("No fancy odds data available or invalid format");
          setFancyOddsMappings([]);
        }
      } catch (error) {
        console.error("Error fetching fancy odds:", error);
        setFancyOddsMappings([]);
      }
    };

    fetchInitialFancyOdds();
    const interval = setInterval(fetchInitialFancyOdds, 1500);
    return () => clearInterval(interval);
  }, [eventId, marketId]);

  const updateFancyOdds = async () => {
    if (!eventId || !marketId) return;

    try {
      const response = await fetch(
        `https://test.book2500.in/fetch-fancy-odds/${eventId}/${marketId}`
      );
      const responseData = await response.json();

      if (responseData?.data) {
        // Update the fancy odds state with the new data
        setFancyOddsMappings((prevOdds) => {
          return prevOdds.map((odd) => {
            // Find matching runner by RunnerName
            const realtimeOdd = responseData.data.find(
              (r: any) => r.RunnerName === odd.RunnerName
            );

            if (realtimeOdd) {
              return {
                ...odd,
                back: odd.back
                  ? {
                      ...odd.back,
                      price: realtimeOdd.BackPrice1,
                      size: realtimeOdd.BackSize1,
                      isSuspended: realtimeOdd.GameStatus === "SUSPENDED",
                    }
                  : null,
                lay: odd.lay
                  ? {
                      ...odd.lay,
                      price: realtimeOdd.LayPrice1,
                      size: realtimeOdd.LaySize1,
                      isSuspended: realtimeOdd.GameStatus === "SUSPENDED",
                    }
                  : null,
              };
            }
            return odd;
          });
        });
      }
    } catch (error) {
      console.error("Error updating fancy odds:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(updateFancyOdds, 1500);
    return () => clearInterval(interval);
  }, [eventId, marketId]);

  const fetchBookmakerMappings = useCallback(async () => {
    if (!eventId || !marketId) return;

    try {
      const response = await fetch(
        "https://book2500.funzip.in/api/bookmaker-odds",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: eventId,
            market_id: marketId,
          }),
        }
      );

      const data = await response.json();
      if (data?.data) {
        // Update the interface mapping to match the API response structure
        setBookmakerMappings(
          data.data.map((item: any) => ({
            ...item,
            SelectionId: item.SelectionId.toString(), // Ensure SelectionId is string
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching bookmaker mappings:", error);
    }
  }, [eventId, marketId]);

  useEffect(() => {
    fetchBookmakerMappings();
  }, [fetchBookmakerMappings]);

  const fetchBookmakerOdds = useCallback(async () => {
    if (!eventId || !marketId) return;

    try {
      const response = await fetch(
        `https://test.book2500.in/fetch-bookmaker-odds/${eventId}/${marketId}`
      );
      const data = await response.json();

      if (data?.data) {
        setBookmakerMarket(data.data);
        // console.log(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookmaker odds:", error);
    }
  }, [eventId, marketId]);

  useEffect(() => {
    fetchBookmakerOdds();
    const interval = setInterval(fetchBookmakerOdds, 1000);
    return () => clearInterval(interval);
  }, [fetchBookmakerOdds]);

  const fetchRecentBets = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("https://book2500.funzip.in/api/bet-log", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      console.log(data);
      if (data.logs) {
        const pendingBets = data.logs.filter(
          (log: BetLog) => log.status === "0"
        );
        setRecentBets(pendingBets);
      }
    } catch (error) {
      console.error("Error fetching recent bets:", error);
    }
  }, []);

  useEffect(() => {
    fetchRecentBets();
    const interval = setInterval(fetchRecentBets, 5000);
    return () => clearInterval(interval);
  }, [fetchRecentBets]);

  useEffect(() => {
    const fetchBetMaps = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch("https://book2500.funzip.in/api/bet-log", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();
        if (data.logs) {
          // Sort by created_at to get most recent first
          const sortedLogs = [...data.logs].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          // Get only the latest bet
          const latestBet = sortedLogs[0];

          if (
            latestBet &&
            !latestBet.is_cashed_out &&
            latestBet.status === "0"
          ) {
            const investAmount = parseFloat(latestBet.invest_amount || "0.0");
            const returnAmount = parseFloat(latestBet.return_amount || "0.0");
            const liability = parseFloat(latestBet.liability || "0.0");
            const isBack = latestBet.is_back === 1;

            // Create object for both selected and opposite runners
            const newBetMaps: { [key: string]: any } = {};

            // For selected runner
            newBetMaps[latestBet.selection_id] = {
              amount: isBack ? returnAmount - investAmount : -liability,
              isBack,
              created_at: latestBet.created_at,
            };

            // Find the opposite runner ID from event odds
            const oppositeRunner = eventOdds.runners.find(
              (runner) => runner.selectionId !== latestBet.selection_id
            );

            if (oppositeRunner) {
              newBetMaps[oppositeRunner.selectionId] = {
                amount: isBack ? -investAmount : investAmount,
                isBack,
                created_at: latestBet.created_at,
              };
            }

            setBetMaps(newBetMaps);
          } else {
            setBetMaps({});
          }
        }
      } catch (error) {
        console.error("Error fetching bet maps:", error);
      }
    };

    fetchBetMaps();
    const interval = setInterval(fetchBetMaps, 5000);
    return () => clearInterval(interval);
  }, [eventOdds.runners]);

  const handleStakeButton = (
    type: "min" | "max" | "predefined",
    value?: number
  ) => {
    if (type === "predefined" && value) {
      setSelectedStake(value.toString());
    } else {
      setSelectedStake(
        type === "min" ? MIN_STAKE.toString() : MAX_STAKE.toString()
      );
    }
  };

  const handleClearStake = () => {
    setSelectedStake("");
    setSelectedOdds("");
  };

  const toggleSection = (section: "matchOdds" | "bookmaker" | "fancy") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePlaceBet = async () => {
    if (!isBrowser || !selectedBet) return;

    toast.loading("Processing your bet...");

    try {
      if (
        !selectedBet ||
        !selectedOdds ||
        !selectedStake ||
        !selectedBet.selectionId
      ) {
        toast.dismiss();
        toast.error("Unable to place bet", {
          description: "Please select odds and enter stake amount",
        });
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.dismiss();
        toast.error("Authentication required", {
          description: "Please login to place bets",
        });
        router.push("/login");
        return;
      }

      const stakeAmount = parseInt(selectedStake, 10);
      if (isNaN(stakeAmount) || stakeAmount < MIN_STAKE) {
        toast.dismiss();
        toast.error("Invalid stake amount", {
          description: `Minimum stake amount is ₹${MIN_STAKE}`,
        });
        return;
      }

      if (stakeAmount > MAX_STAKE) {
        toast.dismiss();
        toast.error("Invalid stake amount", {
          description: `Maximum stake amount is ₹${MAX_STAKE}`,
        });
        return;
      }

      const userBalanceNum = parseInt(userBalance, 10);
      if (stakeAmount > userBalanceNum) {
        toast.dismiss();
        toast.error("Insufficient balance", {
          description: `Available balance: ₹${userBalanceNum}`,
        });
        return;
      }

      const requestBody = {
        invest_amount: parseInt(selectedStake, 10),
        ratio: selectedOdds,
        betoption_id: selectedBet.betoption_id,
        betquestion_id: selectedBet.betquestion_id,
        match_id: selectedBet.match_id,
        selection_id: selectedBet.selectionId,
        level: selectedBet.level || 0, // Include level parameter, default to 0 if not set
        isback:
          selectedBet.type.toLowerCase() === "back" ||
          selectedBet.type.toLowerCase() === "no"
            ? 1
            : 0,
      };

      console.log("Sending bet request:", requestBody);

      const response = await fetch(
        "https://book2500.funzip.in/api/prediction",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      toast.dismiss();

      if (!data.success) {
        if (data.message === "Time has been expired") {
          toast.error("Bet placement failed", {
            description:
              selectedBet?.section === "FANCY"
                ? "The fancy betting time has expired"
                : "The betting time has expired for this market",
          });
        } else if (data.message?.includes("balance")) {
          toast.error("Insufficient balance", {
            description: data.message,
          });
        } else {
          toast.error("Bet placement failed", {
            description: data.message || "Unable to place bet at this time",
          });
        }
        return;
      }

      toast.success("Bet placed successfully!", {
        description: `${selectedBet.name} - ₹${selectedStake} @ ${selectedOdds}\nMarket: ${selectedBet.section}`,
      });

      const newBalance = (userBalanceNum - stakeAmount).toString();
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user_data");
        if (userData) {
          const parsedData = JSON.parse(userData);
          parsedData.balance = newBalance;
          localStorage.setItem("user_data", JSON.stringify(parsedData));
        }
      }

      setUserBalance(newBalance);
      handleClearStake();
      setSelectedBet(null);
      setShowMobileBetForm(false);
    } catch (error: unknown) {
      toast.dismiss();
      console.error("Error details:", error);
      toast.error("Bet placement failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  // Add this helper function to check runner types
  const isMatchRunner = (runner: any): runner is Runner => {
    return runner && "runner" in runner && "ex" in runner;
  };

  const handleOddsClick = (
    runner: Runner | BookmakerRunner | FancyOdds,
    type: "back" | "lay" | "no" | "yes",
    section: "match" | "bookmaker" | "fancy",
    index: number = 0 // Add index parameter with default value
  ) => {
    setBetError(null);

    try {
      let isSuspended = false;
      let oddsValue = "";
      let betData = null;

      if (section === "match" && isMatchRunner(runner)) {
        if (!runner.ex) return;
        const odds =
          type === "back"
            ? runner.ex.availableToBack?.[index]
            : runner.ex.availableToLay?.[index];

        // Check if odds are suspended
        isSuspended =
          !odds || typeof odds.price !== "number" || odds.price <= 0;
        if (isSuspended) {
          setBetError("This market is currently suspended");
          return;
        }

        oddsValue = odds.price.toFixed(2);

        // Find the corresponding match data
        betData = matchApiData.find(
          (data) =>
            data.Option_name.toLowerCase() === runner.runner.toLowerCase()
        );

        if (!betData) {
          setBetError("Unable to find match data");
          return;
        }

        setSelectedBet({
          name: runner.runner,
          type: type.toUpperCase(),
          section: "MATCH",
          betoption_id: betData.Option_id,
          betquestion_id: betData.Question_id,
          match_id: Number(betData.Match_id),
          selectionId: runner.selectionId,
          level: index, // Include level in setSelectedBet
        });

        setSelectedOdds(oddsValue);
        setSelectedStake(MIN_STAKE.toString());

        if (isMobile) {
          setShowMobileBetForm(true);
        }
      } else {
        // Handle other bet types
        // ...existing code for fancy and bookmaker...
      }
    } catch (error) {
      console.error("Error processing odds:", error);
      setBetError("Failed to process bet");
    }
  };

  const handleFancyBet = (odd: GroupedFancyOdd, type: "no" | "yes") => {
    const option = type === "no" ? odd.back : odd.lay;
    if (!option) return;

    setSelectedBet({
      name: odd.RunnerName,
      type: type.toUpperCase(),
      section: "FANCY",
      betoption_id: option.Option_id,
      betquestion_id: odd.Question_id,
      match_id: parseInt(odd.Match_id, 10),
    });

    // Hardcode ratio to 2 for fancy bets
    setSelectedOdds("2.00");
    setSelectedStake(MIN_STAKE.toString());

    if (isMobile) {
      setShowMobileBetForm(true);
    }
  };

  const handleBookmakerBet = (
    runner: BookmakerRunner,
    type: "back" | "lay",
    index: number
  ) => {
    if (runner.status === "SUSPENDED") return;

    const odds =
      type === "back"
        ? runner.ex?.availableToBack?.[index]?.price
        : runner.ex?.availableToLay?.[index]?.price;

    if (!odds) return;

    // Find the matching mapping for this runner by matching runnerName with Option_name
    const mapping = bookmakerMappings.find(
      (m) => m.Option_name.toLowerCase() === runner.runnerName.toLowerCase()
    );

    if (!mapping) {
      console.error("No mapping found for runner:", runner);
      toast.error("Unable to place bet: Invalid selection");
      return;
    }

    setSelectedBet({
      name: runner.runnerName,
      type: type.toUpperCase(),
      section: "BOOKMAKER",
      betoption_id: mapping.Option_id,
      betquestion_id: mapping.Question_id,
      match_id: Number(mapping.Match_id),
      selectionId: mapping.SelectionId,
      level: index,
    });

    setSelectedOdds(odds.toFixed(2));
    setSelectedStake(MIN_STAKE.toString());

    if (isMobile) {
      setShowMobileBetForm(true);
    }
  };

  const calculateReturns = useCallback(() => {
    if (!selectedOdds || !selectedStake) return null;

    const stake = Number(selectedStake);
    const odds = Number(selectedOdds);

    if (isNaN(stake) || isNaN(odds)) return null;

    const profit = stake * odds - stake;
    const potentialReturn = stake + profit;

    // Find the teams based on section
    let selectedTeam = "";
    let otherTeam = "";

    if (
      selectedBet?.section === "MATCH" ||
      selectedBet?.section === "BOOKMAKER"
    ) {
      // For match odds and bookmaker, get team names from runners
      selectedTeam = selectedBet?.name || "";
      otherTeam =
        eventOdds.runners?.find((r) => r.runner !== selectedBet?.name)
          ?.runner || "";
    } else if (selectedBet?.section === "FANCY") {
      // For fancy bets, just use the selected option name
      selectedTeam = selectedBet?.name || "";
      otherTeam = ""; // No other team for fancy bets
    }

    // Calculate profit/loss for each team based on bet type
    const isBack = selectedBet?.type === "BACK" || selectedBet?.type === "NO";
    const profitAmount = Math.abs(profit);
    const stakeAmount = Math.abs(stake);

    return {
      stake,
      profit: profitAmount,
      odds,
      potentialReturn,
      selectedTeam,
      otherTeam,
      isback: isBack,
      // Add separate profit/loss amounts for each team
      selectedTeamAmount: isBack ? profitAmount : -stakeAmount,
      otherTeamAmount: isBack ? -stakeAmount : profitAmount,
    };
  }, [selectedOdds, selectedStake, selectedBet, eventOdds.runners]);

  const getFancyOddsMapping = useCallback(
    (selectionId: string | number) => {
      return fancyOddsMappings.find(
        (mapping) => mapping.SelectionId === String(selectionId)
      );
    },
    [fancyOddsMappings]
  );

  const handleCashout = async (type: string, selectionId?: string) => {
    setCashoutType(type);
    if (selectionId) setCashoutSelectionId(selectionId);
    setShowCashoutDialog(true);
  };

  const processCashout = async () => {
    setShowCashoutDialog(false);
    toast.loading("Processing cashout...");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("https://book2500.funzip.in/api/bet-log", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      const pendingBets =
        data.logs?.filter((log: any) => log.status === "0") || [];

      if (pendingBets.length === 0) {
        toast.dismiss();
        toast.error("No pending bets found for cashout");
        return;
      }

      const latestBet = pendingBets[0];

      // Find the runners based on bet section
      let runners;
      let section = "";
      if (cashoutType === "match-odds") {
        runners = eventOdds.runners;
        section = "MATCH";
      } else if (cashoutType === "bookmaker-odds") {
        runners = bookmakerMarket?.runners.map((runner) => ({
          selectionId: runner.selectionId,
          runner: runner.runnerName,
          ex: {
            availableToBack: runner.ex.availableToBack,
            availableToLay: runner.ex.availableToLay,
          },
        }));
        section = "BOOKMAKER";
      }

      if (!runners || runners.length < 2) {
        toast.dismiss();
        toast.error("Market data not available");
        return;
      }

      // Find selected runner and opposite runner
      const selectedRunner = runners.find(
        (r) => r.selectionId === latestBet.selection_id
      );
      const oppositeRunner = runners.find(
        (r) => r.selectionId !== latestBet.selection_id
      );

      if (!selectedRunner?.ex || !oppositeRunner?.ex) {
        toast.dismiss();
        toast.error("Unable to find matching odds for cashout");
        return;
      }

      const base0 =
        latestBet.isback === 1
          ? selectedRunner.ex.availableToBack?.[latestBet.level || 0]?.price
          : selectedRunner.ex.availableToLay?.[latestBet.level || 0]?.price;

      const base1 =
        latestBet.isback === 1
          ? oppositeRunner.ex.availableToBack?.[latestBet.level || 0]?.price
          : oppositeRunner.ex.availableToLay?.[latestBet.level || 0]?.price;

      if (!base0 || !base1) {
        toast.dismiss();
        toast.error("Unable to calculate cashout ratios");
        return;
      }

      // Calculate profit/loss for each team
      const investAmount = Number(latestBet.invest_amount);
      const isBack = latestBet.isback === 1;

      const selectedTeamAmount = isBack
        ? base0 * investAmount - investAmount
        : -(base0 * investAmount - investAmount);

      const otherTeamAmount = isBack
        ? -(base1 * investAmount - investAmount)
        : base1 * investAmount - investAmount;

      // Update dialog with profit/loss info
      setCashoutProfitLoss({
        selectedTeam: selectedRunner.runner,
        otherTeam: oppositeRunner.runner,
        selectedTeamAmount,
        otherTeamAmount,
        section,
      });

      const cashoutData: CashoutData = {
        bet_invest_id: latestBet.id,
        base0: base0.toString(),
        base1: base1.toString(),
      };

      const result = await executeCashout(cashoutData);

      toast.dismiss();

      if (result.success) {
        toast.success(result.message, {
          description: result.refund_amount
            ? `Refund Amount: ₹${result.refund_amount.toFixed(
                2
              )}\nNew Balance: ₹${result.new_balance?.toFixed(2)}`
            : undefined,
        });
        updateBalanceFromAPI();
      } else {
        toast.error("Cashout failed", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Cashout error:", error);
      toast.dismiss();
      toast.error("Failed to process cashout");
    }
  };

  const handleCashoutClick = useCallback(
    (e: React.MouseEvent, type: string, selectionId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      setCashoutType(type);
      if (selectionId) setCashoutSelectionId(selectionId);

      // Calculate profit/loss for display
      const profitAmount = 100; // Replace with actual calculation
      setCashoutProfitLoss({
        selectedTeam: "",
        otherTeam: "",
        selectedTeamAmount: profitAmount,
        otherTeamAmount: -profitAmount,
        section: "",
      });

      setShowCashoutDialog(true);
    },
    []
  );

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2a1a47]">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  const team1 = eventOdds.runners?.[0]?.runner || "--";
  const team2 = eventOdds.runners?.[1]?.runner || "--";

  return (
    <div className="min-h-screen bg-[#2a1a47]">
      <div className="bg-gradient-to-b from-[#3a2255] to-[#231439] p-4 border-b border-purple-800">
        <div className="container mx-auto">
          <div className="text-white text-xl font-bold mb-2">
            {team1} vs {team2}
          </div>

          <div className="w-full flex flex-col gap-2">
            <div className="w-full h-[300px] bg-black rounded-lg overflow-hidden">
              {liveMatchData?.tv ? (
                <iframe
                  src={liveMatchData.tv}
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

            <div className="w-full h-[124px] bg-black rounded-lg overflow-hidden">
              {liveMatchData?.iframeScore && (
                <iframe
                  src={liveMatchData.iframeScoreV1}
                  className="w-full h-full border-0"
                  scrolling="no"
                  style={{
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 pb-20 lg:pb-0">
            {/* MATCH ODDS */}
            <div className="mb-4">
              <div
                className="flex items-center justify-between bg-[#231439] p-3 cursor-pointer"
                onClick={() => toggleSection("matchOdds")}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 text-white flex items-center justify-center mr-2">
                    ★
                  </div>
                  <h2 className="text-white font-bold">MATCH ODDS</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleCashoutClick(e, "match-odds")}
                    className="bg-green-600 text-white text-xs px-2 py-1 rounded"
                  >
                    CASHOUT
                  </button>
                  <div className="text-white text-xs hidden sm:block">
                    Min: 100 | Max: 250K
                  </div>
                  <div className="text-white">
                    {expandedSections.matchOdds ? "▲" : "▼"}
                  </div>
                </div>
              </div>

              {expandedSections.matchOdds && (
                <div className="p-0">
                  <div className="grid grid-cols-2 w-full">
                    <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                      BACK
                    </div>
                    <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                      LAY
                    </div>
                  </div>

                  {eventOdds.runners?.map((runner, idx) => {
                    const profitLoss =
                      calculateProfitLoss()[runner.selectionId];
                    const isSuspended = [0, 1, 2].some((index) => {
                      const backOdds =
                        runner.ex?.availableToBack?.[index]?.price ?? 0;
                      const layOdds =
                        runner.ex?.availableToLay?.[index]?.price ?? 0;
                      return backOdds <= 0 || layOdds <= 0;
                    });

                    return (
                      <div key={idx} className="border-b border-purple-900">
                        <div className="text-white font-bold pl-4 py-2 bg-[#231439] flex justify-between items-center">
                          <span>{runner.runner}</span>
                          {betMaps[runner.selectionId] && (
                            <div className="mr-4">
                              <span
                                className={`font-medium ${
                                  betMaps[runner.selectionId].amount > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {betMaps[runner.selectionId].amount > 0
                                  ? "+"
                                  : ""}
                                ₹
                                {Math.abs(
                                  betMaps[runner.selectionId].amount
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-6 w-full relative">
                          {isSuspended && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                              <span className="text-red-500 font-bold text-lg">
                                SUSPENDED
                              </span>
                            </div>
                          )}
                          {[2, 1, 0].map((i) => {
                            const odds =
                              runner.ex?.availableToBack?.[i]?.price || 0;
                            const size =
                              runner.ex?.availableToBack?.[i]?.size || 0;
                            const isAvailable = odds > 0 && !isSuspended;

                            return (
                              <div
                                key={`back-${i}`}
                                onClick={() =>
                                  isAvailable &&
                                  handleOddsClick(runner, "back", "match", i)
                                }
                                className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 ${
                                  isAvailable ? "cursor-pointer" : "opacity-90"
                                } ${
                                  i === 0
                                    ? "bg-[#72bbee]"
                                    : i === 1
                                    ? "bg-[#72bbee] "
                                    : "bg-[#72bbee] "
                                }`}
                              >
                                <div className="text-white font-bold">
                                  {odds > 0 ? odds.toFixed(2) : "0.0"}
                                </div>
                                <div className="text-xs text-gray-200">
                                  {size > 0 ? size.toLocaleString() : "0.0"}
                                </div>
                              </div>
                            );
                          })}

                          {[0, 1, 2].map((i) => {
                            const odds =
                              runner.ex?.availableToLay?.[i]?.price || 0;
                            const size =
                              runner.ex?.availableToLay?.[i]?.size || 0;
                            const isAvailable = odds > 0 && !isSuspended;

                            return (
                              <div
                                key={`lay-${i}`}
                                onClick={() =>
                                  isAvailable &&
                                  handleOddsClick(runner, "lay", "match", i)
                                }
                                className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 ${
                                  isAvailable ? "cursor-pointer" : "opacity-90"
                                } ${
                                  i === 0
                                    ? "bg-[#ff9393]"
                                    : i === 1
                                    ? "bg-[#ff9393]"
                                    : "bg-[#ff9393]"
                                }`}
                              >
                                <div className="text-white font-bold">
                                  {odds > 0 ? odds.toFixed(2) : "0.0"}
                                </div>
                                <div className="text-xs text-gray-200">
                                  {size > 0 ? size.toLocaleString() : "0.0"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BOOKMAKER ODDS */}
            <div className="mb-4">
              <div
                className="flex items-center justify-between bg-[#231439] p-3 cursor-pointer"
                onClick={() => toggleSection("bookmaker")}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 text-white flex items-center justify-center mr-2">
                    ★
                  </div>
                  <h2 className="text-white font-bold">BOOKMAKER</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleCashoutClick(e, "bookmaker-odds")}
                    className="bg-green-600 text-white text-xs px-2 py-1 rounded"
                  >
                    CASHOUT
                  </button>
                  <div className="text-white text-xs hidden sm:block">
                    Min: {bookmakerMarket?.min || "100"} | Max:{" "}
                    {bookmakerMarket?.max || "250K"}
                  </div>
                  <div className="text-white">
                    {expandedSections.bookmaker ? "▲" : "▼"}
                  </div>
                </div>
              </div>

              {expandedSections.bookmaker && (
                <div className="p-0 overflow-hidden">
                  <div className="grid grid-cols-2 w-full">
                    <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                      BACK
                    </div>
                    <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                      LAY
                    </div>
                  </div>
                  {/* First team */}
                  {bookmakerMarket?.runners?.[0] && (
                    <div
                      key={bookmakerMarket.runners[0].selectionId}
                      className="border-b border-purple-900"
                    >
                      <div className="text-white font-bold pl-4 py-2 bg-[#231439] flex justify-between items-center">
                        <span>{bookmakerMarket.runners[0].runnerName}</span>
                        {betMaps[bookmakerMarket.runners[0].selectionId] && (
                          <div className="space-y-1 flex flex-col items-end mr-4">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-gray-300">
                                {bookmakerMarket.runners[0].runnerName}
                              </span>
                              <span
                                className={`font-medium ${
                                  betMaps[
                                    bookmakerMarket.runners[0].selectionId
                                  ].amount > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {betMaps[bookmakerMarket.runners[0].selectionId]
                                  .amount > 0
                                  ? "+"
                                  : ""}
                                ₹
                                {Math.abs(
                                  betMaps[
                                    bookmakerMarket.runners[0].selectionId
                                  ].amount
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-6 w-full relative">
                        {bookmakerMarket.runners[0].status === "SUSPENDED" && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <span className="text-red-500 font-bold text-lg">
                              SUSPENDED
                            </span>
                          </div>
                        )}
                        {/* Back prices */}
                        {[2, 1, 0].map((i) => (
                          <div
                            key={`back-${i}`}
                            onClick={() =>
                              bookmakerMarket.runners[0].status === "ACTIVE" &&
                              handleBookmakerBet(
                                bookmakerMarket.runners[0],
                                "back",
                                i
                              )
                            }
                            className="flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 bg-[#72bbee] cursor-pointer"
                          >
                            <div className="text-white font-bold">
                              {bookmakerMarket.runners[0].back[
                                i
                              ]?.price?.toFixed(1) || "0.0"}
                            </div>
                            <div className="text-xs text-gray-200">
                              {Number(
                                bookmakerMarket.runners[0].back[i]?.size || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {/* Lay prices */}
                        {[0, 1, 2].map((i) => (
                          <div
                            key={`lay-${i}`}
                            onClick={() =>
                              bookmakerMarket.runners[0].status === "ACTIVE" &&
                              handleBookmakerBet(
                                bookmakerMarket.runners[0],
                                "lay",
                                i
                              )
                            }
                            className="flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 bg-[#ff9393] cursor-pointer"
                          >
                            <div className="text-white font-bold">
                              {bookmakerMarket.runners[0].lay[
                                i
                              ]?.price?.toFixed(1) || "0.0"}
                            </div>
                            <div className="text-xs text-gray-200">
                              {Number(
                                bookmakerMarket.runners[0].lay[i]?.size || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marquee between teams */}
                  {bookmakerMarket?.rem && (
                    <div className="p-2 border-b border-purple-900">
                      <div className="whitespace-nowrap animate-marquee">
                        <span className="text-red-500 font-medium">
                          {bookmakerMarket.rem}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Second team */}
                  {bookmakerMarket?.runners?.[1] && (
                    <div
                      key={bookmakerMarket.runners[1].selectionId}
                      className="border-b border-purple-900"
                    >
                      <div className="text-white font-bold pl-4 py-2 bg-[#231439] flex justify-between items-center">
                        <span>{bookmakerMarket.runners[1].runnerName}</span>
                        {betMaps[bookmakerMarket.runners[1].selectionId] && (
                          <div className="space-y-1 flex flex-col items-end mr-4">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-gray-300">
                                {bookmakerMarket.runners[1].runnerName}
                              </span>
                              <span
                                className={`font-medium ${
                                  betMaps[
                                    bookmakerMarket.runners[1].selectionId
                                  ].amount > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {betMaps[bookmakerMarket.runners[1].selectionId]
                                  .amount > 0
                                  ? "+"
                                  : ""}
                                ₹
                                {Math.abs(
                                  betMaps[
                                    bookmakerMarket.runners[1].selectionId
                                  ].amount
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-6 w-full relative">
                        {bookmakerMarket.runners[1].status === "SUSPENDED" && (
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="text-red-500 font-bold text-lg">
                              SUSPENDED
                            </span>
                          </div>
                        )}
                        {/* Back prices */}
                        {[2, 1, 0].map((i) => (
                          <div
                            key={`back-${i}`}
                            onClick={() =>
                              bookmakerMarket.runners[1].status === "ACTIVE" &&
                              handleBookmakerBet(
                                bookmakerMarket.runners[1],
                                "back",
                                i
                              )
                            }
                            className="flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 bg-[#72bbee] cursor-pointer"
                          >
                            <div className="text-white font-bold">
                              {bookmakerMarket.runners[1].back[
                                i
                              ]?.price?.toFixed(1) || "0.0"}
                            </div>
                            <div className="text-xs text-gray-200">
                              {Number(
                                bookmakerMarket.runners[1].back[i]?.size || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {/* Lay prices */}
                        {[0, 1, 2].map((i) => (
                          <div
                            key={`lay-${i}`}
                            onClick={() =>
                              bookmakerMarket.runners[1].status === "ACTIVE" &&
                              handleBookmakerBet(
                                bookmakerMarket.runners[1],
                                "lay",
                                i
                              )
                            }
                            className="flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 bg-[#ff9393] cursor-pointer"
                          >
                            <div className="text-white font-bold">
                              {bookmakerMarket.runners[1].lay[
                                i
                              ]?.price?.toFixed(1) || "0.0"}
                            </div>
                            <div className="text-xs text-gray-200">
                              {Number(
                                bookmakerMarket.runners[1].lay[i]?.size || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marquee between teams */}
                  {bookmakerMarket?.rem && (
                    <div className="p-2 border-b border-purple-900">
                      <div className="whitespace-nowrap animate-marquee">
                        <span className="text-red-500 font-medium">
                          {bookmakerMarket.rem}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FANCY ODDS */}
            <div className="mb-4">
              <div
                className="flex items-center justify-between bg-[#231439] p-3 cursor-pointer"
                onClick={() => toggleSection("fancy")}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 text-white flex items-center justify-center mr-2">
                    ★
                  </div>
                  <h2 className="text-white font-bold">FANCY</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-white text-xs hidden sm:block">
                    Min: 100 | Max: 250K
                  </div>
                  <div className="text-white">
                    {expandedSections.fancy ? "▲" : "▼"}
                  </div>
                </div>
              </div>

              {expandedSections.fancy && (
                <div className="p-0">
                  <div className="grid grid-cols-2 w-full">
                    <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                      NO
                    </div>
                    <div className="text-center py-2 bg-[#3a2255] text-white font-bold border-b border-purple-800">
                      YES
                    </div>
                  </div>

                  <div className="space-y-2">
                    {fancyOddsMappings
                      .sort((a, b) => {
                        const selectionIdA =
                          a.back?.SelectionId || a.lay?.SelectionId || "";
                        const selectionIdB =
                          b.back?.SelectionId || b.lay?.SelectionId || "";
                        return selectionIdA.localeCompare(selectionIdB);
                      })
                      .map((odd, idx) => {
                        const isSuspended = !odd.back?.price || !odd.lay?.price;

                        return (
                          <div
                            key={`${odd.Question_id}-${idx}`}
                            className="border-b border-purple-900 last:border-b-0"
                          >
                            <div className="text-white font-bold pl-4 py-2">
                              {odd.RunnerName}
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-2 relative">
                              {isSuspended && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <span className="text-red-500 font-bold text-lg">
                                    SUSPENDED
                                  </span>
                                </div>
                              )}
                              {/* NO button */}
                              <button
                                onClick={() =>
                                  !isSuspended && handleFancyBet(odd, "no")
                                }
                                disabled={isSuspended}
                                className="flex flex-col items-center justify-center rounded p-2 text-center bg-[#72bbee] cursor-pointer disabled:opacity-50"
                              >
                                <span className="text-white font-bold text-lg">
                                  {odd.back?.price?.toFixed(0) || "0"}
                                </span>
                                <span className="text-xs text-gray-200">
                                  {odd.back?.size?.toLocaleString() || "0"}
                                </span>
                              </button>
                              {/* YES button */}
                              <button
                                onClick={() =>
                                  !isSuspended && handleFancyBet(odd, "yes")
                                }
                                disabled={isSuspended}
                                className="flex flex-col items-center justify-center rounded p-2 text-center bg-[#ff9393] cursor-pointer disabled:opacity-50"
                              >
                                <span className="text-white font-bold text-lg">
                                  {odd.lay?.price?.toFixed(0) || "0"}
                                </span>
                                <span className="text-xs text-gray-200">
                                  {odd.lay?.size?.toLocaleString() || "0"}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-[350px] sticky top-0 h-screen">
            <div className="h-full p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-[#231439] via-[#2a1a47] to-[#231439] rounded-lg p-4 shadow-xl border border-purple-900">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-white">
                    <div className="font-bold text-lg">
                      {eventOdds.eventName}
                    </div>
                    <div className="text-gray-300 text-sm">
                      {selectedBet ? (
                        <span>
                          {selectedBet.name} - {selectedBet.type} (
                          {selectedBet.section})
                        </span>
                      ) : (
                        "Select a bet"
                      )}
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm">
                    Balance: ₹{userBalance}
                  </div>
                </div>

                <div className="space-y-4">
                  {calculateReturns() && (
                    <div className="bg-[#3a2255] rounded-lg p-4 border border-purple-900 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white">
                          Confirm Bet Before Placing
                        </span>
                        <span className="text-white font-bold">
                          {selectedBet?.type}@
                          {calculateReturns()?.odds.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-green-400 font-medium">
                        Potential return : +₹
                        {calculateReturns()?.potentialReturn.toFixed(0)}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-purple-800">
                        {calculateReturns()?.selectedTeam && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">
                              {calculateReturns()?.selectedTeam}
                            </span>
                            <span
                              className={`font-medium ${
                                calculateReturns()?.selectedTeamAmount > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {calculateReturns()?.selectedTeamAmount > 0
                                ? "+"
                                : ""}
                              ₹
                              {Math.abs(
                                calculateReturns()?.selectedTeamAmount || 0
                              ).toFixed(0)}
                            </span>
                          </div>
                        )}

                        {calculateReturns()?.otherTeam && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">
                              {calculateReturns()?.otherTeam}
                            </span>
                            <span
                              className={`font-medium ${
                                calculateReturns()?.otherTeamAmount > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {calculateReturns()?.otherTeamAmount > 0
                                ? "+"
                                : ""}
                              ₹
                              {Math.abs(
                                calculateReturns()?.otherTeamAmount || 0
                              ).toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Input
                    type="number"
                    value={selectedOdds}
                    onChange={(e) => setSelectedOdds(e.target.value)}
                    className="bg-[#3a2255] text-white text-sm border-purple-900"
                    placeholder="Odds"
                  />
                  <Input
                    type="number"
                    value={selectedStake}
                    onChange={(e) => setSelectedStake(e.target.value)}
                    className="bg-[#3a2255] text-white text-sm border-purple-900"
                    placeholder="Stakes"
                  />
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {PREDEFINED_STAKES.low.map((stake, index) => (
                      <Button
                        key={`stake-${index}`}
                        onClick={() => handleStakeButton("predefined", stake)}
                        className="bg-[#3a2255] hover:bg-[#4c2a70] text-white text-sm py-1"
                      >
                        {stake.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {PREDEFINED_STAKES.high.map((stake, index) => (
                      <Button
                        key={`stake-${index}`}
                        onClick={() => handleStakeButton("predefined", stake)}
                        className="bg-[#3a2255] hover:bg-[#4c2a70] text-white text-sm py-1"
                      >
                        {stake.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStakeButton("min")}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black flex-1 text-sm"
                    >
                      MIN
                    </Button>
                    <Button
                      onClick={() => handleStakeButton("max")}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 text-sm"
                    >
                      MAX
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="bg-[#3a2255] text-white flex-1 text-sm"
                      onClick={handleClearStake}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="default"
                      className="bg-green-600 text-white flex-1 text-sm"
                      onClick={handlePlaceBet}
                      disabled={!selectedBet || !selectedOdds || !selectedStake}
                    >
                      Place Bet
                    </Button>
                  </div>
                  {/* <button
                    onClick={(e) => handleCashoutClick(e, "match-odds")}
                    className="w-full bg-yellow-500 text-black mt-4 py-2 rounded"
                  >
                    Cashout Match
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300"
          style={{
            transform: showMobileBetForm ? "translateY(0)" : "translateY(100%)",
          }}
        >
          <div className="bg-gradient-to-t from-[#231439] to-transparent p-2">
            <div className="bg-[#2a1a47] rounded-t-lg p-4 shadow-xl border border-purple-900 border-b-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white text-lg">
                      {selectedBet?.name || "Select a bet"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowMobileBetForm(false);
                        setSelectedBet(null);
                        handleClearStake();
                      }}
                      className="text-gray-400 hover:text-white p-2"
                    >
                      ✕
                    </button>
                  </div>
                  {selectedBet && (
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-white text-sm">
                        {selectedBet.type} @ {selectedOdds}
                      </p>
                      <p className="text-white text-sm">
                        Balance: ₹
                        {Number.parseInt(userBalance).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {calculateReturns() && (
                  <div className="bg-[#3a2255] rounded-lg p-4 border border-purple-900 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white">
                        Confirm Bet Before Placing
                      </span>
                      <span className="text-white font-bold">
                        {selectedBet?.type}@
                        {calculateReturns()?.odds.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-green-400 font-medium">
                      Potential return : +₹
                      {calculateReturns()?.potentialReturn.toFixed(0)}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-purple-800">
                      {calculateReturns()?.selectedTeam && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            {calculateReturns()?.selectedTeam}
                          </span>
                          <span
                            className={`font-medium ${
                              calculateReturns()?.selectedTeamAmount > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {calculateReturns()?.selectedTeamAmount > 0
                              ? "+"
                              : ""}
                            ₹
                            {Math.abs(
                              calculateReturns()?.selectedTeamAmount || 0
                            ).toFixed(0)}
                          </span>
                        </div>
                      )}

                      {calculateReturns()?.otherTeam && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            {calculateReturns()?.otherTeam}
                          </span>
                          <span
                            className={`font-medium ${
                              calculateReturns()?.otherTeamAmount > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {calculateReturns()?.otherTeamAmount > 0 ? "+" : ""}
                            ₹
                            {Math.abs(
                              calculateReturns()?.otherTeamAmount || 0
                            ).toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Input
                  type="number"
                  value={selectedOdds}
                  readOnly
                  className="w-full bg-[#3a2255] text-white border-0 rounded-lg text-lg h-12"
                />
                <Input
                  type="number"
                  value={selectedStake}
                  onChange={(e) => setSelectedStake(e.target.value)}
                  placeholder="Stakes"
                  className="w-full bg-[#3a2255] text-white border-0 rounded-lg text-lg h-12"
                />

                <div className="grid grid-cols-4 gap-3">
                  {PREDEFINED_STAKES.low
                    .concat(PREDEFINED_STAKES.high)
                    .map((stake, index) => (
                      <button
                        key={index}
                        className="bg-[#4c2a70] text-white py-3 px-2 rounded-lg text-sm font-medium hover:bg-[#5c3a80] transition-colors"
                        onClick={() => handleStakeButton("predefined", stake)}
                      >
                        {stake.toLocaleString()}
                      </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="bg-yellow-500 text-black py-3 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                    onClick={() => handleStakeButton("min")}
                  >
                    MIN
                  </button>
                  <button
                    className="bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    onClick={() => handleStakeButton("max")}
                  >
                    MAX
                  </button>
                </div>

                {betError && (
                  <p className="text-red-500 text-sm text-center">{betError}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="bg-[#3a2255] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#4c2a70] transition-colors"
                    onClick={handleClearStake}
                  >
                    Clear
                  </button>
                  <button
                    className="bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePlaceBet}
                    disabled={
                      !selectedStake ||
                      Number(selectedStake) < MIN_STAKE ||
                      Number(selectedStake) > MAX_STAKE
                    }
                  >
                    Place Bet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile && selectedBet && !showMobileBetForm && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setShowMobileBetForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg"
          >
            <span className="text-2xl">+</span>
          </Button>
        </div>
      )}

      <CashoutDialog
        isOpen={showCashoutDialog}
        onClose={() => setShowCashoutDialog(false)}
        onConfirm={processCashout}
        profitLoss={cashoutProfitLoss}
      />
    </div>
  );
}
