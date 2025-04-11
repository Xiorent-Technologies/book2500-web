'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function OtpVerificationForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [otp, setOtp] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(60)

    const phone = searchParams.get('phone')
    const token = searchParams.get('token')
    const isSignup = searchParams.get('isSignup') === 'true'

    useEffect(() => {
        if (!phone || !token) {
            router.push(isSignup ? '/register' : '/login')
        }
    }, [phone, token, router, isSignup])

    useEffect(() => {
        const timer = countdown > 0 && setInterval(() => setCountdown(prev => prev - 1), 1000)
        return () => {
            if (timer) clearInterval(timer)
        }
    }, [countdown])

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await fetch(`https://book2500.funzip.in/api/${isSignup ? 'verify-register' : 'verify-login'}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ temp_token: token, otp }),
            });

            const data = await response.json()

            if (data.login === true) {
                if (data.token) {
                    localStorage.setItem('auth_token', data.token)
                    localStorage.setItem('user_data', JSON.stringify(data.data))
                    window.dispatchEvent(new Event('auth-change'))
                    router.push('/')
                } else {
                    router.push('/login')
                }
            } else {
                setError(data.message || "Invalid OTP. Please try again.")
            }
        } catch (error) {
            console.error("Verification error:", error)
            setError("Verification failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (countdown > 0) return

        try {
            let formattedPhone = phone || ""
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
                setCountdown(60)
            } else {
                setError(data.message || "Failed to resend OTP")
            }
        } catch (error) {
            console.error("Resend error:", error)
            setError("Failed to resend OTP")
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-136px)]">
            <div className="w-full max-w-md mx-auto p-6 flex items-center">
                <div className="w-full bg-brand-darkPurple rounded-lg shadow-xl p-8 border-2 border-amber-500">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Verify OTP</h1>
                        <p className="text-gray-400 mt-2">Enter the OTP sent to {phone}</p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-200">
                                Enter OTP
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

                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 font-bold py-3"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "VERIFY OTP"}
                        </Button>

                        <div className="flex justify-between items-center text-sm">
                            <button
                                type="button"
                                className={`text-brand-gold ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
                                onClick={handleResendOtp}
                                disabled={countdown > 0}
                            >
                                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                            </button>

                            <button
                                type="button"
                                className="text-brand-gold hover:underline"
                                onClick={() => router.push(isSignup ? '/register' : '/login')}
                            >
                                Change Number
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
