"use client";

import { useEffect, useState } from "react";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  id: number;
  trans_id: string;
  description: string;
  amount: string;
  old_bal: string;
  new_bal: string;
  type: string | null;
  status: string;
  created_at: string;
  title: string;
  trx: string;
  main_amo: string;
  charge: string;
}

interface TransactionResponse {
  page_title: string;
  trans: {
    data: Transaction[];
    current_page: number;
    last_page: number;
    total: number;
  };
  success: boolean;
}

export default function TransactionLogPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(
        "https://book2500.funzip.in/api/transaction-log",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data: TransactionResponse = await response.json();
      setTransactions(data.trans.data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        <div className="md:col-span-9">
          <div className="bg-brand-darkPurple rounded-lg shadow-xl p-4 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
              Transaction History
            </h1>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-12 w-full bg-brand-purple/50 rounded-md" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No transaction history found
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-brand-purple">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-300"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-300"
                        >
                          TRX
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-300"
                        >
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-300"
                        >
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-brand-purple/20">
                          <td className="px-4 py-3 text-sm text-white">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {tx.trx}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge
                              className={`${
                                tx.type === "+"
                                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              }`}
                            >
                              ₹{tx.amount}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            ₹{tx.new_bal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-brand-purple/20 p-4 rounded-lg border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-sm text-white font-medium">
                          {formatDate(tx.created_at)}
                        </div>
                        <Badge
                          className={`${
                            tx.type === "+"
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          }`}
                        >
                          ₹{tx.amount}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-gray-400">Transaction ID:</div>
                        <div className="text-white truncate">{tx.trx}</div>

                        <div className="text-gray-400">Balance:</div>
                        <div className="text-white">₹{tx.new_bal}</div>
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
