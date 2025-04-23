/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
import { fetchUserProfile } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DepositLog {
  id: string;
  amount: string;
  trx: string;
  status: number;
  created_at: string;
}

export default function DepositLogPage() {
  const [deposits, setDeposits] = useState<DepositLog[]>([]);
  const [loading, setLoading] = useState(true);

  interface UserProfile {
    id: string;
    name: string;
    email: string;
    // Add other fields as per the structure of the user profile
  }

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch both profile and deposit history
        const [profileData, depositHistory] = await Promise.all([
          fetchUserProfile(),
          fetchDepositHistory(),
        ]);
        setProfile(profileData);
        setDeposits(depositHistory.deposits || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchDepositHistory = async () => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("https://book2500.funzip.in/api/deposit-log", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "0":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
            Pending
          </Badge>
        );
      case "-1":
        return (
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
            Successful
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
              Deposit History
            </h1>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-12 w-full bg-brand-purple/50 rounded-md" />
                  </div>
                ))}
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No deposit history found
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
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-300"
                        >
                          Transaction ID
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-300"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {deposits.map((deposit) => (
                        <tr
                          key={deposit.id}
                          className="hover:bg-brand-purple/20"
                        >
                          <td className="px-4 py-3 text-sm text-white">
                            {formatDate(deposit.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            ₹{deposit.amount}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {deposit.trx}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getStatusBadge(deposit.status.toString())}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {deposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="bg-brand-purple/20 p-4 rounded-lg border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-sm text-white font-medium">
                          ₹{deposit.amount}
                        </div>
                        {getStatusBadge(deposit.status.toString())}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-gray-400">Date:</div>
                        <div className="text-white">
                          {formatDate(deposit.created_at)}
                        </div>

                        <div className="text-gray-400">Transaction ID:</div>
                        <div className="text-white truncate">{deposit.trx}</div>
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
