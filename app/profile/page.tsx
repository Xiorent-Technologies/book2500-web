"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProfileSidebar from "@/components/shared/ProfileSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

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

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("auth_token");
    const storedUserData = localStorage.getItem("user_data");

    if (!token || !storedUserData) {
      router.push("/login");
      return;
    }

    setUserData(JSON.parse(storedUserData));
    setLoading(false);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        {/* Main Profile Content */}
        <div className="md:col-span-9">
          <Card className="bg-brand-darkPurple border-purple-900/50 shadow-xl overflow-hidden">
            {loading ? (
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <Skeleton className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-brand-purple/50" />
                  <div className="w-full space-y-6">
                    <Skeleton className="h-8 w-48 bg-brand-purple/50" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20 bg-brand-purple/50" />
                          <Skeleton className="h-6 w-32 bg-brand-purple/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            ) : userData ? (
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  {/* Profile Image */}
                  <div className="w-full md:w-auto flex flex-col items-center space-y-4">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden flex shrink-0 border-4 border-brand-gold shadow-xl">
                      <Image
                        src={userData.image_url || "/placeholder.svg"}
                        alt={userData.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 8rem, (max-width: 768px) 10rem, 12rem"
                        priority
                      />
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="w-full space-y-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {userData.name}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white">{userData.email}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Mobile</p>
                        <p className="text-white">{userData.mobile}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Balance</p>
                        <p className="text-white text-xl font-bold">
                          ₹{userData.balance}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Referral Code</p>
                        <p className="text-brand-gold font-medium">
                          {userData.referral_token}
                        </p>
                      </div>
                      {userData.address && (
                        <div className="space-y-2 col-span-1 md:col-span-2">
                          <p className="text-gray-400 text-sm">Address</p>
                          <p className="text-white">
                            {userData.address}
                            {userData.city && `, ${userData.city}`}
                            {userData.country && `, ${userData.country}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-6 md:p-8">
                <div className="text-center text-gray-400 py-8">
                  Failed to load profile data. Please try again.
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
