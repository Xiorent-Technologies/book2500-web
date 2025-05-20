/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateBalanceFromAPI } from "@/lib/utils";
import { executeCashout, PredictionData } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MIN_STAKE = 100;
const MAX_STAKE = 250000;

// Add this constant for predefined stakes
const PREDEFINED_STAKES: any = {
  low: [100, 500, 1000, 2000],
  high: [5000, 10000, 25000, 50000],
} as const;

const isBrowser = typeof window !== "undefined";

interface Runner {
  selectionId: string;
  back: RunnerPrice[];
  lay: RunnerPrice[];
  runner: any;
  match_id: string;
}

interface SelectedBet {
  name: string;
  type: string;
  section: string;
  selectionId?: string | number;
  betoption_id: number;
  betquestion_id: number;
  match_id: number;
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
  selectionId: number;
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
  rem: string;
  back?: {
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
    price: number;
    size: number;
    isSuspended?: boolean;
  };
  lay?: {
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
    price: number;
    size: number;
    isSuspended?: boolean;
  };
}

interface FancyApiMapping {
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
  BackPrice1: number;
  BackSize1: number;
  LayPrice1: number;
  LaySize1: number;
  GameStatus: string;
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
  type: string;
  potentialInvest?: string;
  potentialReturn?: string;
  isBack?: number;
}

function CashoutDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  potentialInvest,
  potentialReturn,
  isBack,
}: CashoutDialogProps) {
  // Get the appropriate amounts based on the cashout type
  const amount =
    Math.abs(Number(isBack === 1 ? potentialReturn : potentialInvest)) * 0.9;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2D1A4A] border border-purple-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Confirm {type === "match-odds" ? "Match Odds" : "Bookmaker"} Cashout
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            <div className="space-y-2">
              <p>
                Do you want to proceed with the{" "}
                {type === "match-odds" ? "match odds" : "bookmaker"} cashout?
              </p>
              {potentialReturn && (
                <div className="mt-4 p-3 bg-[#3a2255] rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Cashout Amount</span>
                    <span className="text-green-400">
                      +₹{amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
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
            onClick={() => onConfirm()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Confirm Cashout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OddsMapping {
  [key: string]: PredictionData;
}

interface RealTimeOdds {
  event_data?: {
    runners: Array<{
      selectionId: number;
      ex?: {
        availableToBack?: Array<{ price: number; size: number }>;
        availableToLay?: Array<{ price: number; size: number }>;
      };
    }>;
  };
}

interface GroupedFancyOdd {
  RunnerName: string;
  Match_id: string;
  Question_id: number;
  back?: {
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
    price: number;
    size: number;
    isSuspended?: boolean;
  };
  lay?: {
    Option_id: number;
    Option_name: string;
    SelectionId: string;
    min: string;
    max: string;
    price: number;
    size: number;
    isSuspended?: boolean;
  };
}

interface FancyApiMapping {
  RunnerName: string;
  Question_id: number;
  Option_id: number;
  Option_name: string;
  SelectionId: string;
  min: string;
  max: string;
}

interface CashoutData {
  bet_invest_id: number;
  base0: string;
  base1: string;
}

interface EventOddsState {
  eventName: string;
  marketId?: string;
  runners: Runner[];
}

interface BookmakerMapping {
  SelectionId: string;
  Option_id: number;
  Option_name: string;
  Question_id: number;
  Match_id: string;
}

interface BetLog {
  id: string;
  match_id: string;
  selection_id: string;
  is_cashed_out: number;
  status: string;
  is_back: number;
  level: string;
  selection_id_matchodds?: string;
  selection_id_bookmaker?: string;
  potential_invest_matchodds?: string;
  potential_return_matchodds?: string;
  is_back_matchodds?: number;
  potential_invest_bookmaker?: string;
  potential_return_bookmaker?: string;
  is_back_bookmaker?: number;
  base0_matchodds: string;
  base0_bookmaker: string;
  base1_bookmaker: string;
  base1_matchodds: string;
  option_1: string;
  option_2: string;
  mo_option_1: string;
  mo_option_2: string
}

interface BetLogEntry {
  match_id: string;
  is_cashed_out: number;
  status: string;
  selection_id: string;
  level: string;
}

interface RunnerPrice {
  level: string;
  price: string;
}

interface CashoutResponse {
  success: boolean;
  refund_amount: number;
  message?: string;
}

export default function LiveMatch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("match");
  const marketId = searchParams.get("market");

  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [selectedOdds, setSelectedOdds] = useState("");
  const [selectedStake, setSelectedStake] = useState("");
  const [eventOdds, setEventOdds] = useState<EventOddsState>({
    eventName: "",
    marketId: "",
    runners: [],
  });
  const [fancyOdds, setFancyOdds] = useState<FancyOdds[]>([]);
  const [bookmakerMarket, setBookmakerMarket] = useState<BookmakerMarket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [betError, setBetError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [showMobileBetForm, setShowMobileBetForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [liveMatchData, setLiveMatchData] = useState<LiveMatchData | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    matchOdds: true,
    bookmaker: true,
    fancy: true,
  });
  const [isMatchLive, setIsMatchLive] = useState(false);
  const [fancyOddsMappings, setFancyOddsMappings] = useState<FancyOddsMapping[]>([]);
  const [matchApiData, setMatchApiData] = useState<EventOddApiData[]>([]);
  const [showCashoutDialog, setShowCashoutDialog] = useState<boolean>(false);
  const [cashoutType, setCashoutType] = useState<string>("");
  const [betLogData, setBetLogData] = useState<BetLog | null>(null);
  const [bookmakerMappings, setBookmakerMappings] = useState<BookmakerMapping[]>([]);
  const [isBookMarkBet, serIsBookMark] = useState<boolean>(false)
  const [newBetlog, setNewBetlog] = useState<any>([])
  // console.log('newBetlog', newBetlog)
  const fetchcalculations = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please login to continue");
        router.push("/login");
        return;
      }
      const response = await fetch(`https://test.book2500.in/api/bet/bet-options/${eventId}/${marketId}`);
    } catch (error) {
      console.error("Error fetching bet history:", error);
      // setBets([]);
    } finally {
      // setLoading(false);
    }
  }, [eventId, marketId, router]);

  useEffect(() => { fetchcalculations() }, [fetchcalculations])

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
    }, 1500);

    return () => clearInterval(balanceInterval);
  }, []);



  const fetchcalculation = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please login to continue");
        router.push("/login");
        return;
      }

      const response = await fetch("https://book2500.funzip.in/api/bet-cal", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setNewBetlog(data)
      } else {
        toast.error("Failed to load bet history");
      }
    } catch (error) {
      console.error("Error fetching bet history:", error);
      // setBets([]);
    } finally {
      // setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchcalculation() }, [fetchcalculation])

  useEffect(() => {
    const fetchLiveMatchData = async () => {
      if (!eventId) return;

      try {
        // First fetch the score and TV data mapping
        const response = await fetch("https://app.livetvapi.com/api/get-all-tv", {
          cache: "no-store",
        });
        const data: LiveMatchData[] = await response.json();
        const matchData = data.find((match) => match.eventId === eventId);

        if (matchData) {
          // Update the TV URL to use the new API endpoint
          const tvUrl = `https://app.livetvapi.com/event-play-2/${eventId}`;
          setLiveMatchData({
            ...matchData,
            tv: tvUrl,
            // Use the matched iframeScoreV1 from the API response
            iframeScore: matchData.iframeScore,
          });
          setIsMatchLive(true);
        } else {
          setLiveMatchData(null);
          setIsMatchLive(false);
        }
      } catch (error) {
        console.error("Error fetching live match data:", error);
        setLiveMatchData(null);
        setIsMatchLive(false);
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
          oddsMapping[odd.selectionId] = odd;
        });

        // Store the mapping for later use
        setMatchApiData(data.data);

        setEventOdds({
          eventName: data.data[0]?.RunnerName || "",
          marketId: marketId,
          runners: data.data.map((odd: any) => ({
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

    const response = await fetch(
      `https://test.book2500.in/api/bet/insert-question/${eventId}/${marketId}`
    );
    try {
      const data: RealTimeOdds = await response.json();
      if (data?.event_data?.runners) {
        setEventOdds((prev) => {
          const updatedRunners = prev.runners.map((runner) => {
            const realtimeRunner = data?.event_data?.runners?.find(
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
          });

          return {
            ...prev,
            runners: updatedRunners,
          };
        });
      }
    } catch (err) {
      console.error("Error fetching real-time odds:", err);
    }
  }, [eventId, marketId, eventOdds.runners.length]);

  useEffect(() => {
    fetchOddsData();
    const interval = setInterval(fetchOddsData, 1200);
    return () => clearInterval(interval);
  }, [fetchOddsData]);

  useEffect(() => {
    const fetchAndMergeFancyOdds = async () => {
      if (!eventId || !marketId) return;

      try {
        // 1. Fetch Match_id + Option_id + Question_id from fancy-odds
        const fancyRes = await fetch(`https://book2500.funzip.in/api/fancy-odds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId, market_id: marketId }),
        });

        const fancyJson = await fancyRes.json();
        const fancyMap = Array.isArray(fancyJson?.data)
          ? fancyJson.data.reduce((acc: any, item: any) => {
            acc[item.RunnerName] = {
              Match_id: item.Match_id,
              Option_id: item.Option_id,
              Question_id: item.Question_id,
            };
            return acc;
          }, {})
          : {};

        // 2. Fetch UI-render data from retrieve API
        const dataRes = await fetch(
          `https://test.book2500.in/api/book/retrieve/${eventId}/${marketId}`
        );
        const dataJson = await dataRes.json();
        // console.log('dataJson', dataJson)
        if (!Array.isArray(dataJson?.data)) {
          setFancyOddsMappings([]);
          return;
        }

        // 3. Merge data from both APIs by RunnerName
        const merged = dataJson.data.map((item: any) => {
          const runnerKey = item.runnerName;
          const fancyInfo = fancyMap[runnerKey];
          return {
            RunnerName: runnerKey,
            Match_id: fancyInfo?.Match_id || "",
            Question_id: fancyInfo?.Question_id || 0,
            rem: item.rem,
            back: {
              Option_id: fancyInfo?.Option_id || 0,
              Option_name: "back",
              SelectionId: String(item?.selectionId || ""), // fallback if needed
              min: String(item.minAmount || "100"),
              max: String(item.maxAmount || "50000"),
              price: item.BackPrice1 || 0,
              size: 0,
            },
            lay: {
              Option_id: fancyInfo?.Option_id || 0,
              Option_name: "lay",
              SelectionId: String(item?.selectionId || ""), // fallback if needed
              min: String(item.minAmount || "100"),
              max: String(item.maxAmount || "50000"),
              price: item.LayPrice1 || 0,
              size: 0,
            },
          };
        });

        setFancyOddsMappings(merged);
      } catch (error) {
        console.error("Error fetching fancy odds data:", error);
        setFancyOddsMappings([]);
      }
    };

    fetchAndMergeFancyOdds();
    const interval = setInterval(fetchAndMergeFancyOdds, 2000);

    return () => clearInterval(interval);
  }, [eventId, marketId]);


  // const updateFancyOdds = useCallback(async () => {
  //   if (!eventId || !marketId) return;

  //   try {
  //     const response = await fetch(
  //       `https://book2500.funzip.in/api/fancy-odds`,
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ event_id: eventId, market_id: marketId }),
  //       }
  //     );
  //     const data = await response.json();
  //     // console.log('+++++++++++++++',data)
  //     if (data?.data) {
  //       setFancyOddsMappings((prev) => {
  //         const newMappings = prev.map((mapping) => {
  //           const runner = data.data.find(
  //             (r: { Match_id: string, RunnerName: string; BackPrice1: number; BackSize1: number; LayPrice1: number; LaySize1: number; isSuspended: boolean }) =>
  //               r.RunnerName === mapping.RunnerName
  //           );
  //           // console.log('======mapping=====',runner.Match_id)
  //           if (runner && mapping.back && mapping.lay) {
  //             return {
  //               ...mapping,
  //               Match_id: runner.Match_id,
  //               back: {
  //                 ...mapping.back,
  //                 price: runner.BackPrice1 || 0,
  //                 size: runner.BackSize1 || 0,
  //                 isSuspended: runner.isSuspended || false
  //               },
  //               lay: {
  //                 ...mapping.lay,
  //                 price: runner.LayPrice1 || 0,
  //                 size: runner.LaySize1 || 0,
  //                 isSuspended: runner.isSuspended || false
  //               }
  //             };
  //           }
  //           return mapping;
  //         });
  //         return newMappings;
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error updating fancy odds:", error);
  //   }
  // }, [eventId, marketId]);

  // useEffect(() => {
  //   let mounted = true;

  //   const fetchAndUpdate = async () => {
  //     if (mounted) {
  //       await updateFancyOdds();
  //     }
  //   };

  //   fetchAndUpdate();
  //   const interval = setInterval(fetchAndUpdate, 2500);

  //   return () => {
  //     mounted = false;
  //     clearInterval(interval);
  //   };
  // }, [updateFancyOdds]);

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
      // console.log('===>', data)
      if (data?.data) {
        setBookmakerMappings(data.data);
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
        `https://test.book2500.in/api/v2/bm/get-bookmaker-odds-redis-cache/${eventId}/${marketId}`
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

  // Move fetchBetLog definition before useEffect
  const fetchBetLog = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch("https://book2500.funzip.in/api/bet-log", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setBetLogData(data);
      }
    } catch (error) {
      console.error("Error fetching bet log:", error);
    }
  }, []);

  // fetchBetLog();
  // Initial fetch on mount
  useEffect(() => {
    fetchBetLog();
  }, [fetchBetLog]); // Add fetchBetLog to the dependencies

  const handlePlaceBet = async () => {
    if (!isBrowser || !selectedBet) return;

    const loadingToast = toast.loading("Processing your bet...");

    try {
      if (!selectedBet || !selectedOdds || !selectedStake) {
        toast.dismiss(loadingToast);
        toast.error("Unable to place bet", {
          description: "Please select odds and enter stake amount",
        });
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.dismiss(loadingToast);
        toast.error("Authentication required", {
          description: "Please login to place bets",
        });
        router.push("/login");
        return;
      }

      const stakeAmount = parseInt(selectedStake, 10);
      if (isNaN(stakeAmount) || stakeAmount < MIN_STAKE) {
        toast.dismiss(loadingToast);
        toast.error("Invalid stake amount", {
          description: `Minimum stake amount is ₹${MIN_STAKE}`,
        });
        return;
      }

      if (stakeAmount > MAX_STAKE) {
        toast.dismiss(loadingToast);
        toast.error("Invalid stake amount", {
          description: `Maximum stake amount is ₹${MAX_STAKE}`,
        });
        return;
      }

      const userBalanceNum = parseInt(userBalance, 10);
      if (stakeAmount > userBalanceNum) {
        toast.dismiss(loadingToast);
        toast.error("Insufficient balance", {
          description: `Available balance: ₹${userBalanceNum}`,
        });
        return;
      }

      // Convert stake amount from rupees to paisa
      const stakeInPaisa = isBookMarkBet ? stakeAmount / 100 : stakeAmount;
      const requestBody: any = {
        SelectionId: String(selectedBet.selectionId) || "",
        selection_id: String(selectedBet.selectionId) || "",
        RunnerName: selectedBet.name,
        Option_name: selectedBet.name,
        Option_id: selectedBet.betoption_id,
        Question_id: selectedBet.betquestion_id,
        Match_id: selectedBet.match_id,
        invest_amount: stakeAmount,
        betoption_id: selectedBet.betoption_id,
        betquestion_id: selectedBet.betquestion_id,
        match_id: selectedBet.match_id,
        ratio: isBookMarkBet ? String((Number(selectedOdds) / 100 + 1).toFixed(2)) : selectedOdds,
        isback: selectedBet.type.toLowerCase() === "back" || selectedBet.type.toLowerCase() === "no" ? 1 : 0,
        level: 1
      };
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
      toast.dismiss(loadingToast);

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

      await fetchBetLog();
      await fetchcalculation();

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
      toast.dismiss(loadingToast);
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
  interface Runner {
    runner: any;
    ex: any;
    selectionId: string
    // Add any other properties that are part of the Runner type
  }

  const isMatchRunner = (runner: unknown): runner is Runner => {
    return typeof runner === 'object' && runner !== null && 'runner' in runner && 'ex' in runner;
  };

  const handleOddsClick = (
    runner: Runner | BookmakerRunner | FancyOdds,
    type: "back" | "lay" | "no" | "yes",
    section: "match" | "bookmaker" | "fancy",
    index: number = 0 // Add index parameter
  ) => {
    setBetError(null);
    serIsBookMark(false)
    try {
      let isSuspended = false;
      let oddsValue = "";
      let betData = null;

      if (section === "match" && isMatchRunner(runner)) {
        if (!runner.ex) return;
        const odds =
          type === "back"
            ? runner.ex.availableToBack?.[index] // Use index parameter
            : runner.ex.availableToLay?.[index]; // Use index parameter

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
    serIsBookMark(false)
    setSelectedBet({
      name: odd.RunnerName,
      type: type.toUpperCase(),
      section: "FANCY",
      betoption_id: option.Option_id,
      betquestion_id: odd.Question_id,
      match_id: parseInt(odd.Match_id, 10),
      selectionId: option.SelectionId
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
    index: number = 0 // Add index parameter
  ) => {
    if (runner.status === "SUSPENDED") return;
    serIsBookMark(true)
    const odds =
      type === "back"
        ? runner.back?.[index]?.price // Use index parameter
        : runner.lay?.[index]?.price; // Use index parameter

    if (!odds) return;
    // Find the matching mapping for this runner
    const mapping = bookmakerMappings.find(
      (m) => m.SelectionId === runner.selectionId.toString()
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
      selectionId: runner.selectionId,
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
    let profit = 0;
    if (isBookMarkBet) {
      profit = (odds / 100) * stake;
    } else {
      profit = (1 - odds) * stake;
    }
    const potentialReturn = stake + profit;

    const otherTeam =
      eventOdds.runners?.find((r: any) => r.runner !== selectedBet?.name)?.runner ||
      "";

    return {
      stake,
      profit,
      odds,
      potentialReturn,
      selectedTeam: selectedBet?.name || "",
      otherTeam,
      isback: selectedBet?.type === "BACK",
    };
  }, [selectedOdds, selectedStake, isBookMarkBet, eventOdds.runners, selectedBet?.name, selectedBet?.type]);

  const processCashout = async () => {
    setShowCashoutDialog(false);
    toast.error("Cashout feature is not available at the moment.", {
      duration: 3000,
    });
    // toast.loading("Processing cashout...");

    // try {
    //   const urlParams = new URLSearchParams(window.location.search);
    //   const matchId = urlParams.get("match");
    //   const marketId = urlParams.get("market");
    //   const token = localStorage.getItem("auth_token");

    //   if (!matchId || !marketId || !token) {
    //     toast.dismiss();
    //     toast.error("Missing match, market, or auth token");
    //     return;
  }

  const handleCashoutClick = useCallback(
    (e: React.MouseEvent, type: string) => {
      e.preventDefault();
      e.stopPropagation();
      setCashoutType(type);
      let potentialInvest = "";
      let potentialReturn = "";
      let isBack = 0;
      let base0 = "";
      let base1 = "";

      if (type === "match-odds") {
        potentialInvest = betLogData?.potential_invest_matchodds || "";
        potentialReturn = betLogData?.potential_return_matchodds || "";
        isBack = betLogData?.is_back_matchodds || 0;
        base0 = betLogData?.base0_matchodds || "";
        base1 = betLogData?.base1_matchodds || "";
      } else if (type === "bookmaker-odds") {

        potentialInvest = betLogData?.potential_invest_bookmaker || "";
        potentialReturn = betLogData?.potential_return_bookmaker || "";
        isBack = betLogData?.is_back_bookmaker || 0;
        base0 = betLogData?.base0_bookmaker || "";
        base1 = betLogData?.base1_bookmaker || "";
      }

      setShowCashoutDialog(true);
    },
    [betLogData]
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

            <div className="w-full h-[155px] bg-black rounded-lg overflow-hidden">
              {liveMatchData?.iframeScore && (
                <iframe
                  src={liveMatchData.iframeScore}
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
                    onClick={processCashout}
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
                  {eventOdds.runners?.map((runner: any, idx) => {
                    const isSuspended = [0, 1, 2].some((index) => {
                      const backOdds =
                        runner.ex?.availableToBack?.[index]?.price ?? 0;
                      const layOdds =
                        runner.ex?.availableToLay?.[index]?.price ?? 0;
                      return backOdds <= 0 && layOdds <= 0;
                    });
                    return (
                      <div key={idx} className="border-b border-purple-900">
                        {/* Update the match odds display logic */}
                        <div className="text-white font-bold pl-4 py-2 bg-[#231439] flex justify-between items-center">
                          <span>{runner.runner}</span>
                          {/* Find the corresponding bet log entry for the current match */}
                          {newBetlog?.matches && (
                            () => {
                              const currentMatchBetLog = newBetlog?.matches?.find(
                                (log: any) => String(log.match_id) === runner.Match_id
                              );

                              if (currentMatchBetLog) {
                                let optionValue = null;
                                if (String(runner.selectionId) === currentMatchBetLog.selection_id_1) {
                                  optionValue = Number(currentMatchBetLog.mo_option_1);
                                } else {
                                  optionValue = Number(currentMatchBetLog.mo_option_2);
                                }

                                // Display mo_option value if available and not zero
                                if (optionValue !== null && optionValue !== 0) {
                                  return (
                                    <div className="flex flex-col items-end mr-4">
                                      <span
                                        className={`${optionValue > 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                          }`}
                                      >
                                        {optionValue > 0 ? "+" : "-"}
                                        ₹{Math.abs(optionValue)}
                                      </span>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            }
                          )()}
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
                                onClick={
                                  () =>
                                    isAvailable &&
                                    handleOddsClick(runner, "back", "match", i) // Pass index i
                                }
                                className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 ${isAvailable ? "cursor-pointer" : "opacity-90"
                                  } ${i === 0
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
                                onClick={
                                  () =>
                                    isAvailable &&
                                    handleOddsClick(runner, "lay", "match", i) // Pass index i
                                }
                                className={`flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 ${isAvailable ? "cursor-pointer" : "opacity-90"
                                  } ${i === 0
                                    ? "bg-[#ff9393]"
                                    : i === 1
                                      ? "bg-[#ff9393] "
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
                    onClick={processCashout}
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
                  {/* First team in bookmaker */}
                  {bookmakerMarket?.runners && bookmakerMappings?.length > 0 && (
                    <div
                      key={bookmakerMarket.runners[0].selectionId}
                      className="border-b border-purple-900"
                    >
                      <div className="text-white font-bold pl-4 py-2 bg-[#231439] flex justify-between items-center">
                        <span>{bookmakerMarket.runners[0].runnerName}</span>
                        {/* Show only bookmaker data */}
                        {bookmakerMappings[0].Match_id && newBetlog?.matches ? (
                          <div className="flex flex-col items-end mr-4">
                            {/* Display option_1 value if available and not zero */}
                            {(() => {
                              const currentMatchBetLog = newBetlog?.matches?.find(
                                (log: any) => String(log.match_id) === String(bookmakerMappings[0].Match_id)
                              );
                              if (currentMatchBetLog && currentMatchBetLog.option_1 !== null && currentMatchBetLog.option_1 !== '0') {
                                return (
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={`${currentMatchBetLog.option_1 > 0 ? "text-green-400" : "text-red-400"
                                        }`}
                                    >
                                      {currentMatchBetLog.option_1 > 0 ? "+" : "-"}₹
                                      {Math.abs(currentMatchBetLog.option_1)}
                                    </span>
                                  </div>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-6 w-full relative">
                        {bookmakerMarket.runners[0].status === "SUSPENDED" && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
                          </div>
                        )}

                        {/* Back prices */}
                        {[2, 1, 0].map((i) => (
                          <div
                            key={`back-${i}`}
                            onClick={() =>
                              bookmakerMarket.runners[0].status === "ACTIVE" &&
                              handleBookmakerBet(bookmakerMarket.runners[0], "back", i)
                            }
                            className="flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 bg-[#72bbee] cursor-pointer"
                          >
                            <div className="text-white font-bold">
                              {bookmakerMarket.runners[0].back[i]?.price?.toFixed(2) || "0.0"}
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
                              handleBookmakerBet(bookmakerMarket.runners[1], "lay", i)
                            }
                            className="flex flex-col items-center justify-center rounded p-2 text-center mr-2 mb-2 bg-[#ff9393] cursor-pointer"
                          >
                            <div className="text-white font-bold">
                              {bookmakerMarket.runners[0].lay[i]?.price?.toFixed(2) || "0.0"}
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
                  {bookmakerMarket?.rem && bookmakerMappings?.length > 0 && (
                    <div className="p-2 border-b border-purple-900">
                      <div className="whitespace-nowrap animate-marquee">
                        <span className="text-red-500 font-medium">
                          {bookmakerMarket.rem}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Second team in bookmaker */}
                  {bookmakerMarket?.runners?.[1] && bookmakerMappings?.length > 0 && (
                    <div
                      key={bookmakerMarket.runners[1].selectionId}
                      className="border-b border-purple-900"
                    >
                      <div className="text-white font-bold pl-4 py-2 bg-[#231439] flex justify-between items-center">
                        <span>{bookmakerMarket.runners[1].runnerName}</span>
                        {/* Show only bookmaker data */}
                        {newBetlog?.matches && bookmakerMappings?.[0]?.Match_id && (
                          <div className="flex flex-col items-end mr-4">
                            {/* Display mo_option value if available and not zero */}
                            {(() => {
                              const currentMatchBetLog = newBetlog.matches.find(
                                (log: any) => String(log.match_id) === String(bookmakerMappings[0].Match_id)
                              );

                              if (currentMatchBetLog && currentMatchBetLog.option_2 !== null && currentMatchBetLog.option_2 !== '0') {
                                return (
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={`${currentMatchBetLog.option_2 > 0 ? "text-green-400" : "text-red-400"
                                        }`}
                                    >
                                      {currentMatchBetLog.option_2 > 0 ? "+" : "-"}₹
                                      {Math.abs(currentMatchBetLog.option_2)}
                                    </span>
                                  </div>
                                );
                              }

                              return null;
                            })()}
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
                              ]?.price?.toFixed(2) || "0.0"}
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
                              ]?.price?.toFixed(2) || "0.0"}
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
                  {bookmakerMarket?.rem && bookmakerMappings?.length > 0 && (
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
                    {/* Sort fancyOddsMappings based on SelectionId */}
                    {fancyOddsMappings
                      .sort((a, b) => {
                        const selectionIdA =
                          a.back?.SelectionId || a.lay?.SelectionId || "";
                        const selectionIdB =
                          b.back?.SelectionId || b.lay?.SelectionId || "";
                        return selectionIdA.localeCompare(selectionIdB);
                      })
                      .map((odd, idx) => {
                        const hasRem = odd.rem && odd.rem !== "";
                        const isSuspended = !hasRem && !odd.back?.price && !odd.lay?.price;

                        return (
                          <div
                            key={`${odd.Question_id}-${idx}`}
                            className="border-b border-purple-900 last:border-b-0"
                          >
                            <div className="text-white font-bold pl-4 py-2 ">
                              {odd.RunnerName}
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-2 relative">
                              {hasRem ? (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <span className="text-yellow-400 font-bold text-lg">{odd.rem}</span>
                                </div>
                              ) : isSuspended ? (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <span className="text-red-500 font-bold text-lg">SUSPENDED</span>
                                </div>
                              ) : null}
                              {/* NO button */}
                              <button
                                onClick={() =>
                                  !isSuspended && handleFancyBet(odd, "no")
                                }
                                // disabled={isSuspended}
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
                                // disabled={isSuspended}
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

                      {/* <div className="text-green-400 font-medium">
                        Potential return : +₹
                        {calculateReturns()?.potentialReturn.toFixed(0)}
                      </div> */}

                      <div className="space-y-2 pt-2 border-t border-purple-800">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            {calculateReturns()?.selectedTeam}
                          </span>
                          <span
                            className={`font-medium ${calculateReturns()?.isback
                              ? "text-green-400"
                              : "text-red-400"
                              }`}
                          >
                            {calculateReturns()?.isback ? "+" : "-"}₹
                            {isBookMarkBet ? Math.abs(calculateReturns()?.profit ?? 0).toFixed(
                              0
                            ) : Math.abs(calculateReturns()?.profit ?? 0).toFixed(
                              0
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            {calculateReturns()?.otherTeam}
                          </span>
                          <span
                            className={`font-medium ${calculateReturns()?.isback
                              ? "text-red-400"
                              : "text-green-400"
                              }`}
                          >
                            {calculateReturns()?.isback ? "-" : "+"}₹
                            {Math.abs(calculateReturns()?.stake || 0).toFixed(
                              0
                            )}
                          </span>
                        </div>
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
                    {PREDEFINED_STAKES.low.map((stake: any, index: number) => (
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
                    {PREDEFINED_STAKES.high.map((stake: any, index: number) => (
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

      {/* Mobile bet form - Remove duplicate div */}
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

                    {/* <div className="text-green-400 font-medium">
                      Potential return : +₹
                      {calculateReturns()?.potentialReturn.toFixed(0)}
                    </div> */}

                    <div className="space-y-2 pt-2 border-t border-purple-800">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">
                          {calculateReturns()?.selectedTeam}
                        </span>
                        <span
                          className={`font-medium ${calculateReturns()?.isback
                            ? "text-green-400"
                            : "text-red-400"
                            }`}
                        >
                          {calculateReturns()?.isback ? "+" : "-"}₹
                          {Math.abs(calculateReturns()?.profit ?? 0).toFixed(0)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">
                          {calculateReturns()?.otherTeam}
                        </span>
                        <span
                          className={`font-medium ${calculateReturns()?.isback
                            ? "text-red-400"
                            : "text-green-400"
                            }`}
                        >
                          {calculateReturns()?.isback ? "-" : "+"}₹
                          {Math.abs(calculateReturns()?.stake || 0).toFixed(
                            0
                          )}
                        </span>
                      </div>
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
                  placeholder="Stakes"
                  className="bg-[#3a2255] text-white text-sm border-purple-900"
                />

                <div className="grid grid-cols-4 gap-3">
                  {(PREDEFINED_STAKES.low as number[])
                    .concat(PREDEFINED_STAKES.high as number[])
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
        type={cashoutType}
        potentialInvest={
          cashoutType === "match-odds"
            ? betLogData?.potential_invest_matchodds
            : betLogData?.potential_invest_bookmaker
        }
        potentialReturn={
          cashoutType === "match-odds"
            ? betLogData?.potential_return_matchodds
            : betLogData?.potential_return_bookmaker
        }
        isBack={
          cashoutType === "match-odds"
            ? betLogData?.is_back_matchodds
            : betLogData?.is_back_bookmaker
        }
      />
    </div>
  );
}   