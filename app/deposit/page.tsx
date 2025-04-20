'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import ProfileSidebar from "@/components/shared/ProfileSidebar"
import { Textarea } from "@/components/ui/textarea"

interface Gateway {
    id: number
    name: string
    min_amount: number
    max_amount: number
    image: string
}

export default function DepositPage() {
    const router = useRouter()
    const [gateways, setGateways] = useState<Gateway[]>([])
    const [selectedGateway, setSelectedGateway] = useState<number | null>(null)
    const [amount, setAmount] = useState<string>('') // Initialize as empty string
    const [loading, setLoading] = useState(false)
    const [paymentDescription, setPaymentDescription] = useState('')
    const [receiptImage, setReceiptImage] = useState<File | null>(null)

    const fetchGateways = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token")
            if (!token) {
                toast.error("Please login to continue")
                router.push("/login")
                return
            }

            const response = await fetch("https://book2500.funzip.in/api/gateway", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json()

            if (data.success) {
                setGateways(data.data.gateways || [])
            } else {
                // toast.error(data.message || "Failed to load payment gateways")
            }
        } catch (error) {
            console.error("Error fetching gateways:", error)
            toast.error("Failed to load payment gateways")
        }
    }, [router])

    useEffect(() => {
        fetchGateways()
    }, [fetchGateways])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount) {
            toast.error('Please enter amount')
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem('auth_token')
            const formData = new FormData();
            formData.append('amount', amount);
            formData.append('gateway_id', '99');
            if (receiptImage) {
                formData.append('receipt', receiptImage);
            }

            const response = await fetch('https://book2500.funzip.in/api/deposit-confirm', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    toast.success('Deposit request submitted successfully')
                } else {
                    toast.info('Your deposit is under verification', {
                        description: 'We will notify you once it is confirmed'
                    })
                }
                router.push('/deposit-log')
            } else {
                toast.info('Your deposit is under verification', {
                    description: 'We will notify you once it is confirmed'
                })
                router.push('/deposit-log')
            }
        } catch (error) {
            console.error("Error submitting deposit:", error)
            toast.error("Failed to process deposit")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid gap-6 md:grid-cols-12">
                <ProfileSidebar />
                <div className="md:col-span-9">
                    <div className="bg-brand-darkPurple rounded-lg shadow-xl p-6">
                        <h1 className="text-2xl font-bold text-white mb-6">Add Funds</h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-gray-300">Select Payment Method</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {gateways.map((gateway) => (
                                        <div
                                            key={gateway.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedGateway === gateway.id
                                                ? 'border-brand-gold bg-brand-purple'
                                                : 'border-gray-700 hover:border-brand-gold'
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
                                <Label htmlFor="amount" className="text-gray-300">Amount (₹)</Label>
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
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setReceiptImage(e.target.files?.[0] || null)}
                                        className="w-full text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-gray-300">Payment Description</Label>
                                <Textarea
                                    id="description"
                                    value={paymentDescription}
                                    onChange={(e) => setPaymentDescription(e.target.value)}
                                    placeholder="Enter payment details"
                                    className="bg-brand-purple text-white border-gray-700 focus:border-brand-gold min-h-[100px]"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-green-700 cursor-pointer hover:bg-green-600 text-white "
                                disabled={loading || !amount}
                            >
                                {loading ? 'Processing...' : 'Proceed to Pay'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
