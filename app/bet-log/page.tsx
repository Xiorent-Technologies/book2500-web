"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BetLogData {
  id: number;
  user_id: string;
  match_id: string;
  betquestion_id: string;
  betoption_id: string;
  invest_amount: string;
  return_amount: string;
  charge: string;
  remaining_balance: string;
  ratio: string;
  status: string;
  created_at: string;
  updated_at: string;
  betoption: {
    option_name: string;
  };
}

interface FormattedBetLog {
  id: string;
  match_name: string;
  bet_type: string;
  amount: string;
  potential_return: string;
  status: "win" | "loss" | "pending";
  placed_at: string;
}

export default function BetLogPage() {
  const router = useRouter();
  const [bets, setBets] = useState<FormattedBetLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBetHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please login to continue");
        router.push("/login");
        return;
      }

      const response = await fetch("https://book2500.funzip.in/api/bet-log", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const formattedLogs: FormattedBetLog[] = data.logs.map(
          (log: BetLogData) => ({
            id: log.id.toString(),
            match_name: `Match #${log.match_id}`,
            bet_type: log.betoption.option_name,
            amount: log.invest_amount,
            potential_return: log.return_amount,
            status:
              log.status === "0"
                ? "pending"
                : log.status === "1"
                ? "win"
                : "loss",
            placed_at: new Date(log.created_at).toLocaleString("en-IN"),
          })
        );
        setBets(formattedLogs);
      } else {
        toast.error("Failed to load bet history");
      }
    } catch (error) {
      console.error("Error fetching bet history:", error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBetHistory();
  }, [fetchBetHistory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "win":
        return (
          <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
            WIN
          </Badge>
        );
      case "loss":
        return (
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
            LOSS
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
            PENDING
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        <div className="md:col-span-9">
          <div className="bg-brand-darkPurple rounded-lg shadow-xl p-4 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
              Bet History
            </h1>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-12 w-full bg-brand-purple/50 rounded-md" />
                  </div>
                ))}
              </div>
            ) : bets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No bet history found
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-brand-purple">
                      <tr>
                        <th className="px-6 py-3 text-gray-300">Date</th>
                        <th className="px-6 py-3 text-gray-300">Match</th>
                        {/* <th className="px-6 py-3 text-gray-300">Bet Type</th> */}
                        <th className="px-6 py-3 text-gray-300">Amount</th>
                        <th className="px-6 py-3 text-gray-300">
                          Potential Return
                        </th>
                        <th className="px-6 py-3 text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bets.map((bet) => (
                        <tr
                          key={bet.id}
                          className="border-b border-gray-700 hover:bg-brand-purple/20"
                        >
                          <td className="px-6 py-4 text-white">
                            {bet.placed_at}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {bet.match_name}
                          </td>
                          {/* <td className="px-6 py-4 text-white">
                            {bet.bet_type}
                          </td> */}
                          <td className="px-6 py-4 text-white">
                            ₹{Number.parseFloat(bet.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-white">
                            ₹
                            {Number.parseFloat(
                              bet.potential_return
                            ).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(bet.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="bg-brand-purple/20 p-4 rounded-lg border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-sm text-white font-medium">
                          {bet.match_name}
                        </div>
                        {getStatusBadge(bet.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-gray-400">Date:</div>
                        <div className="text-white">{bet.placed_at}</div>

                        <div className="text-gray-400">Bet Type:</div>
                        <div className="text-white">{bet.bet_type}</div>

                        <div className="text-gray-400">Amount:</div>
                        <div className="text-white">
                          ₹{Number.parseFloat(bet.amount).toLocaleString()}
                        </div>

                        <div className="text-gray-400">Potential Return:</div>
                        <div className="text-white">
                          ₹
                          {Number.parseFloat(
                            bet.potential_return
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
