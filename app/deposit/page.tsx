"use client";

import type React from "react";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X } from "lucide-react";

interface Gateway {
  id: number;
  name: string;
  minimum_deposit_amount: string;
  maximum_deposit_amount: string;
  image: string;
  image_url: string;
  account_detais?: string;
  ac_phone_num?: string | null;
  email_id?: string | null;
}

interface DepositResponse {
  message: string;
  page_title: string;
  gateways: Gateway[];
  success: boolean;
}

interface UserData {
  name: string;
  email: string;
  mobile: string;
  balance: string;
  referral_token: string;
  image_url: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export default function DepositPage() {
  const router = useRouter();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const fetchGateways = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const storedUserData = localStorage.getItem("user_data");
      
      if (!token || !storedUserData) {
        toast.error("Please login to continue");
        router.push("/login");
        return;
      }

      const response = await fetch("https://book2500.funzip.in/api/deposit", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const parsedUserData: UserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);

      const data: DepositResponse = await response.json();

      if (data.success) {
        setGateways(data.gateways || []);
      } else {
        toast.error(data.message || "Failed to load payment gateways");
      }
    } catch (error) {
      console.error("Error fetching gateways:", error);
      toast.error("Failed to load payment gateways");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setImageError("Image size should be less than 2MB");
        setPreviewUrl(null);
        setReceiptImage(null);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setImageError("Please upload an image file");
        setPreviewUrl(null);
        setReceiptImage(null);
        return;
      }

      setReceiptImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
      setReceiptImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add validation for amount
    if (!amount) {
      toast.error("Please enter amount");
      return;
    }

    // Add validation for selected gateway
    if (!selectedGateway) {
      toast.error("Please select a payment method");
      return;
    }

    // Find selected gateway details
    const gateway = gateways.find((g) => g.id === selectedGateway);
    if (!gateway) {
      toast.error("Invalid payment method");
      return;
    }

    // Validate amount against gateway limits
    const depositAmount = Number(amount);
    const minAmount = Number(gateway.minimum_deposit_amount);
    const maxAmount = Number(gateway.maximum_deposit_amount);

    if (depositAmount < minAmount) {
      toast.error(`Minimum deposit amount is ₹${minAmount}`);
      return;
    }

    if (depositAmount > maxAmount) {
      toast.error(`Maximum deposit amount is ₹${maxAmount}`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append("gateway_id", selectedGateway.toString());
      formData.append("amount", amount);

      // Only append image if one is selected
      if (receiptImage) {
        formData.append("receipt_image", receiptImage);
      }

      const response = await fetch(
        "https://book2500.funzip.in/api/deposit-callback",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        // Clear form
        setAmount("");
        setReceiptImage(null);
        setSelectedGateway(null);
        setPreviewUrl(null);

        toast.success(data.message || "Deposit request successful");
        router.push("/deposit-log");
      } else {
        throw new Error(data.message || "Failed to process deposit");
      }
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast.error("Failed to process deposit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        <div className="md:col-span-9">
          <div className="bg-brand-darkPurple rounded-lg shadow-xl p-4 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
              Add Funds
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
              <form
                onSubmit={handleSubmit}
                encType="multipart/form-data"
                className="space-y-6"
              >
                <div className="space-y-4">
                  <Label className="text-gray-300">Select Payment Method</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {gateways.map((gateway) => (
                      <Card
                        key={gateway.id}
                        className={`cursor-pointer transition-all border ${
                          selectedGateway === gateway.id
                            ? "border-brand-gold bg-brand-purple"
                            : "border-gray-700 hover:border-brand-gold bg-transparent"
                        }`}
                        onClick={() => setSelectedGateway(gateway.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {gateway.image_url && (
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={gateway.image_url || "/placeholder.svg"}
                                  alt={gateway.name}
                                  fill
                                  className="object-contain rounded"
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-white text-sm font-medium">
                                {gateway.name}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Min: ₹{gateway.minimum_deposit_amount} - Max: ₹
                                {gateway.maximum_deposit_amount}
                              </div>
                              {gateway.account_detais && (
                                <div className="text-xs text-gray-400 mt-1">
                                  UPI ID: {gateway.account_detais}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                Mobile: {userData?.mobile}
                              </div>
                            </div>
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
                  <Label className="text-gray-300">Upload Receipt</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                      previewUrl ? "border-brand-gold" : "border-gray-700"
                    } ${!previewUrl ? "hover:border-gray-500" : ""}`}
                  >
                    {!previewUrl ? (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <label
                          htmlFor="receipt_image"
                          className="cursor-pointer"
                        >
                          <span className="text-sm text-gray-400">
                            Click to upload or drag and drop
                          </span>
                          <input
                            id="receipt_image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 2MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative w-full h-[200px]">
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Receipt preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(null);
                            setReceiptImage(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {imageError && (
                      <p className="text-red-500 text-sm mt-2">{imageError}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-700 cursor-pointer hover:bg-green-600 text-white"
                  disabled={submitting || !amount || !selectedGateway}
                >
                  {submitting ? "Processing..." : "Proceed to Pay"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}