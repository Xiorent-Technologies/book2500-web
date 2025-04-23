"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
import { updateBalanceFromAPI } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  id: number;
  name: string;
  email: string;
  mobile: string;
  email_verified_at: string;
  address: string | null;
  zip_code: string | null;
  city: string | null;
  country: string | null;
  image: string | null;
  image_url: string;
  balance?: number;
}

export default function ProfileSettingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    country: "",
    zip_code: "",
  });

  useEffect(() => {
    // Initial profile load
    const loadProfile = async () => {
      const token = localStorage.getItem("auth_token");
      const storedUserData = localStorage.getItem("user_data");

      if (!token || !storedUserData) {
        router.push("/login");
        return;
      }

      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      setFormData({
        name: parsedData.name || "",
        email: parsedData.email || "",
        mobile: parsedData.mobile || "",
        address: parsedData.address || "",
        city: parsedData.city || "",
        country: parsedData.country || "",
        zip_code: parsedData.zip_code || "",
      });
      setLoading(false);
    };

    loadProfile();

    // Set up balance update interval
    const balanceInterval = setInterval(async () => {
      try {
        const newBalance = await updateBalanceFromAPI();
        if (newBalance) {
          setUserData((prev) => {
            if (!prev) return null;
            return { ...prev, balance: Number(newBalance) };
          });
        }
      } catch (error) {
        console.error("Error updating balance:", error);
      }
    }, 5000);

    return () => clearInterval(balanceInterval);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("https://test.book2500.in/profile-setting", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          zip_code: formData.zip_code,
        }),
      });

      // First check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Try to parse JSON response
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }

      const data = await response.json();

      if (data.success || data.status === "success") {
        // Update local storage
        const currentData = JSON.parse(
          localStorage.getItem("user_data") || "{}"
        );
        const updatedData = { ...currentData, ...formData };
        localStorage.setItem("user_data", JSON.stringify(updatedData));

        toast.success("Profile updated successfully");
        router.push("/profile");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        <div className="md:col-span-9">
          <Card className="bg-brand-darkPurple border-purple-900/50 shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center pb-2 pt-6 px-6">
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Update Profile
              </h1>
              <Button
                variant="outline"
                onClick={() => router.push("/profile")}
                className="text-brand-gold border-brand-gold hover:bg-brand-gold hover:text-black"
                size="sm"
              >
                Return to Profile
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <Skeleton className="w-32 h-32 rounded-full bg-brand-purple/50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20 bg-brand-purple/50" />
                        <Skeleton className="h-10 w-full bg-brand-purple/50" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                      <Image
                        src={
                          userData?.image_url ||
                          "/placeholder.svg?height=128&width=128"
                        }
                        alt={userData?.name || "Profile"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-300">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mobile" className="text-gray-300">
                          Mobile
                        </Label>
                        <Input
                          id="mobile"
                          value={formData.mobile}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              mobile: e.target.value,
                            }))
                          }
                          className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-gray-300">
                          Address
                        </Label>
                        <Input
                          id="address"
                          value={formData.address || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-gray-300">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={formData.city || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip_code" className="text-gray-300">
                          ZIP Code
                        </Label>
                        <Input
                          id="zip_code"
                          value={formData.zip_code || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              zip_code: e.target.value,
                            }))
                          }
                          className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-gray-300">
                          Country
                        </Label>
                        <Input
                          id="country"
                          value={formData.country || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              country: e.target.value,
                            }))
                          }
                          className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/profile")}
                        className="border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-black"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-brand-green hover:bg-green-600 text-white"
                        disabled={submitting}
                      >
                        {submitting ? "Updating..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
