"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Gateway {
  id: number;
  name: string;
  min_amo: number;
  max_amo: number;
}

interface WithdrawMethodResponse {
  success: boolean;
  message?: string;
  gateways: Gateway[];
}

export default function WithdrawPage() {
  const router = useRouter();
  const [withdrawData, setWithdrawData] =
    useState<WithdrawMethodResponse | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Gateway | null>(null);
  const [amount, setAmount] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWithdrawMethods();
  }, []);

  const fetchWithdrawMethods = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("https://book2500.funzip.in/api/withdraw", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data) {
        setWithdrawData(data);
      } else {
        toast.error(data.message || "Failed to load withdrawal methods");
      }
    } catch (err) {
      console.error("Error fetching withdraw methods:", err);
      toast.error("Network error while loading withdrawal methods");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) {
      toast.error("Please select a withdrawal method");
      return;
    }

    const amountNum = Number(amount);
    const minAmo = Number(selectedMethod.min_amo);
    const maxAmo = Number(selectedMethod.max_amo);

    if (amountNum < minAmo || amountNum > maxAmo) {
      toast.error(`Amount must be between ₹${minAmo} and ₹${maxAmo}`);
      return;
    }

    if (!accountDetails.trim()) {
      toast.error("Please enter your account details");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("user_data");
      if (!userData) {
        toast.error("User data not found");
        return;
      }

      const response = await fetch(
        "https://book2500.funzip.in/api/withdraw/confirm",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount,
            method_id: selectedMethod?.id,
            detail: accountDetails,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Withdrawal request submitted successfully");
        router.push("/transaction-log");
      } else {
        toast.error(data.message || "Withdrawal request failed");
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        <div className="md:col-span-9">
          <div className="max-w-2xl mx-auto">
            <div className="bg-brand-darkPurple rounded-lg shadow-xl p-4 md:p-6">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
                Withdraw Funds
              </h1>

              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full bg-brand-purple/50 rounded-md" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-32 w-full bg-brand-purple/50 rounded-md" />
                    <Skeleton className="h-32 w-full bg-brand-purple/50 rounded-md" />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-gray-300">
                      Select Withdrawal Method
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {withdrawData?.gateways?.map((gateway: Gateway) => (
                        <Card
                          key={gateway.id}
                          className={`cursor-pointer transition-all border ${
                            selectedMethod?.id === gateway.id
                              ? "border-brand-gold bg-brand-purple"
                              : "border-gray-700 hover:border-brand-gold bg-transparent"
                          }`}
                          onClick={() => setSelectedMethod(gateway)}
                        >
                          <CardContent className="p-4">
                            <div className="text-white text-sm font-medium">
                              {gateway.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Min: ₹{gateway.min_amo} - Max: ₹{gateway.max_amo}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-300">
                      Amount (₹)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account" className="text-gray-300">
                      Account Details
                    </Label>
                    <Input
                      id="account"
                      value={accountDetails}
                      onChange={(e) => setAccountDetails(e.target.value)}
                      placeholder="Enter your account details"
                      className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={
                      submitting ||
                      !amount ||
                      !selectedMethod ||
                      !accountDetails
                    }
                  >
                    {submitting ? "Processing..." : "Submit Withdrawal"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
