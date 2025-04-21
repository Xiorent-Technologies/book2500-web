"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
// import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface Gateway {
  id: number;
  name: string;
  min_amount: number;
  max_amount: number;
  image: string;
}

export default function DepositPage() {
  const router = useRouter();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>(""); // Initialize as empty string
  const [loading, setLoading] = useState(false);
  // const [paymentDescription, setPaymentDescription] = useState("");
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchGateways = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Please login to continue");
        router.push("/login");
        return;
      }

      const response = await fetch("https://book2500.funzip.in/api/gateway", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setGateways(data.data.gateways || []);
      } else {
        toast.error(data.message || "Failed to load payment gateways");
      }
    } catch (error) {
      console.error("Error fetching gateways:", error);
      // toast.error("Failed to load payment gateways");
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
    if (!amount) {
      toast.error("Please enter amount");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();

      // Send the image directly without any processing
      if (receiptImage) {
        formData.append("receipt_image", receiptImage);
      }

      formData.append("amount", amount);
      formData.append("gateway_id", selectedGateway?.toString() || "99");
      // formData.append("description", paymentDescription);

      console.log("Sending deposit data:", {
        amount,
        gateway_id: selectedGateway || "99",
        has_image: !!receiptImage,
        image_name: receiptImage?.name,
      });

      const response = await fetch(
        "https://book2500.funzip.in/api/deposit-callback",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Accept: "application/json",
            // "Content-Type": "multipart/form-data", // Do not set this header manually
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        // Clear form data like Flutter
        setReceiptImage(null);
        setAmount("");
        setSelectedGateway(null);
        setPreviewUrl(null);

        // Show success message
        if (receiptImage) {
          toast.success("Deposit request successful. Wait for review");
        } else {
          toast.success("Deposit successful");
        }

        // Redirect to deposit log
        router.push("/deposit-log");
      } else {
        toast.error(data.message || "Failed to process deposit");
      }
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast.error("Failed to process deposit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        <div className="md:col-span-9">
          <div className="bg-brand-darkPurple rounded-lg shadow-xl p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Add Funds</h1>

            <form
              onSubmit={handleSubmit}
              encType="multipart/form-data"
              className="space-y-6"
            >
              <div className="space-y-4">
                <Label className="text-gray-300">Select Payment Method</Label>
                <div className="grid grid-cols-2 gap-4">
                  {gateways.map((gateway) => (
                    <div
                      key={gateway.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedGateway === gateway.id
                          ? "border-brand-gold bg-brand-purple"
                          : "border-gray-700 hover:border-brand-gold"
                      }`}
                      onClick={() => setSelectedGateway(gateway.id)}
                    >
                      <div className="text-white text-sm">{gateway.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Min: ₹{gateway.min_amount} - Max: ₹{gateway.max_amount}
                      </div>
                    </div>
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
                  value={amount} // Controlled input with string value
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Upload Receipt</Label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-4">
                  <input
                    id="receipt_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-gray-400"
                  />
                  {imageError && (
                    <p className="text-red-500 text-sm mt-2">{imageError}</p>
                  )}
                  {previewUrl && (
                    <div className="mt-4 relative w-full h-[200px]">
                      <Image
                        src={previewUrl}
                        alt="Receipt preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setPreviewUrl(null);
                          setReceiptImage(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Payment Description
                </Label>
                <Textarea
                  id="description"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Enter payment details"
                  className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold min-h-[100px]"
                />
              </div> */}

              <Button
                type="submit"
                className="w-full bg-green-700 cursor-pointer hover:bg-green-600 text-white "
                disabled={loading || !amount}
              >
                {loading ? "Processing..." : "Proceed to Pay"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
