"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [tempToken, setTempToken] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let formattedPhone = mobile
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone
      }
      if (!formattedPhone.startsWith("+91")) {
        formattedPhone = "+91" + formattedPhone.substring(1)
      }

      const response = await fetch("https://book2500.funzip.in/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone: formattedPhone,
        }),
      });

      const data = await response.json()

      if (data.success === true) {
        router.push(`/verify-otp?phone=${encodeURIComponent(formattedPhone)}&token=${encodeURIComponent(data.temp_token)}&isSignup=true`)
      } else {
        setError(data.message || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("Registration failed. Please check your details.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("https://book2500.funzip.in/api/verify-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ temp_token: tempToken, otp }),
      });

      const data = await response.json()

      if (data.success === true) {
        router.push("/login")
      } else {
        setError(data.message || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setError("OTP verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setError("")

    try {
      let formattedPhone = mobile
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone
      }
      if (!formattedPhone.startsWith("+91")) {
        formattedPhone = "+91" + formattedPhone.substring(1)
      }

      const response = await fetch("https://book2500.funzip.in/api/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json()

      if (data.success === true) {
        setTempToken(data.temp_token)
        startCountdown()
      } else {
        setError(data.message || "Failed to resend OTP. Please try again.")
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      setError("Failed to resend OTP. Please try again.")
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-136px)]">
      <div className="w-full max-w-md mx-auto p-6 flex items-center">
        <div className="w-full bg-brand-darkPurple rounded-lg shadow-xl p-8 border-2 border-amber-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-gray-400 mt-2">Join Book2500 and start betting!</p>
          </div>

          {!isOtpSent ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-brand-purple text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-brand-purple text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-200">
                  Mobile Number
                </label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-brand-purple text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <p className="text-xs text-gray-400">Format: +91XXXXXXXXXX</p>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button type="submit" className="w-full bg-green-800 cursor-pointer font-bold py-3" disabled={loading}>
                {loading ? "Registering..." : "SIGN UP"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-400">Already have an account?</span>{" "}
                <Link href="/login" className="text-brand-gold hover:underline">
                  Log in
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-200">
                  Enter OTP sent to your mobile
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-brand-purple text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button type="submit" className="w-full bg-brand-red hover:bg-red-700 font-bold py-3" disabled={loading}>
                {loading ? "Verifying..." : "VERIFY OTP"}
              </Button>

              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  className={`text-brand-gold ${countdown > 0 ? "opacity-50 cursor-not-allowed" : "hover:underline"}`}
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                </button>

                <button type="button" className="text-brand-gold hover:underline" onClick={() => setIsOtpSent(false)}>
                  Change Details
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

