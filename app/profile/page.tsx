'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ProfileSidebar from "@/components/shared/ProfileSidebar"

interface UserData {
  name: string
  email: string
  mobile: string
  balance: string
  referral_token: string
  image_url: string
  address?: string | null
  city?: string | null
  country?: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token')
    const storedUserData = localStorage.getItem('user_data')

    if (!token || !storedUserData) {
      router.push('/login')
      return
    }

    setUserData(JSON.parse(storedUserData))
  }, [router])

  if (!userData) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-12">
        <ProfileSidebar />
        {/* Main Profile Content */}
        <div className="md:col-span-9">
          <div className="bg-brand-darkPurple rounded-lg shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Profile Image */}
              <div className="w-full md:w-1/4 flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden flex shrink-0 border-4 border-brand-gold shadow-xl">
                  <Image
                    src={userData.image_url}
                    alt={userData.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 8rem, (max-width: 768px) 10rem, 12rem"
                    priority
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="w-full md:w-3/4 space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{userData.name}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-gray-400">Email</p>
                    <p className="text-white">{userData.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400">Mobile</p>
                    <p className="text-white">{userData.mobile}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400">Balance</p>
                    <p className="text-white text-xl font-bold">₹{userData.balance}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400">Referral Code</p>
                    <p className="text-brand-gold font-medium">{userData.referral_token}</p>
                  </div>
                  {userData.address && (
                    <div className="space-y-2 col-span-2">
                      <p className="text-gray-400">Address</p>
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
          </div>
        </div>
      </div>
    </div>
  )
}
