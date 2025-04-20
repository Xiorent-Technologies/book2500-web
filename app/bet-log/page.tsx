'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProfileSidebar from "@/components/shared/ProfileSidebar"
import { toast } from 'sonner'

interface BetLogData {
    id: number;
    user_id: string;
    match_id: string;
    betquestion_id: string;
    betoption_id: string;
    invest_amount: string;
    return_amount: string;
    charge: string;
    remaining_balance: string;
    ratio: string;
    status: string;
    created_at: string;
    updated_at: string;
    betoption: {
        option_name: string;
    };
}

interface FormattedBetLog {
    id: string;
    match_name: string;
    bet_type: string;
    amount: string;
    potential_return: string;
    status: 'win' | 'loss' | 'pending';
    placed_at: string;
}

export default function BetLogPage() {
    const router = useRouter()
    const [bets, setBets] = useState<FormattedBetLog[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBetHistory = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token")
            if (!token) {
                toast.error("Please login to continue")
                router.push("/login")
                return
            }

            const response = await fetch("https://book2500.funzip.in/api/bet-log", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json()

            if (data.success) {
                const formattedLogs: FormattedBetLog[] = data.logs.map((log: BetLogData) => ({
                    id: log.id.toString(),
                    match_name: `Match #${log.match_id}`,
                    bet_type: log.betoption.option_name,
                    amount: log.invest_amount,
                    potential_return: log.return_amount,
                    status: log.status === '0' ? 'pending' : log.status === '1' ? 'win' : 'loss',
                    placed_at: new Date(log.created_at).toLocaleString('en-IN')
                }));
                setBets(formattedLogs)
            } else {
                toast.error("Failed to load bet history")
            }
        } catch (error) {
            console.error("Error fetching bet history:", error)
            setBets([])
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchBetHistory()
    }, [fetchBetHistory])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid gap-6 md:grid-cols-12">
                <ProfileSidebar />
                <div className="md:col-span-9">
                    <div className="bg-brand-darkPurple rounded-lg shadow-xl p-6">
                        <h1 className="text-2xl font-bold text-white mb-6">Bet History</h1>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-brand-purple">
                                        <tr>
                                            <th className="px-6 py-3 text-gray-300">Date</th>
                                            <th className="px-6 py-3 text-gray-300">Match</th>
                                            <th className="px-6 py-3 text-gray-300">Bet Type</th>
                                            <th className="px-6 py-3 text-gray-300">Amount</th>
                                            <th className="px-6 py-3 text-gray-300">Potential Return</th>
                                            <th className="px-6 py-3 text-gray-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bets.map((bet) => (
                                            <tr key={bet.id} className="border-b border-gray-700">
                                                <td className="px-6 py-4 text-white">{bet.placed_at}</td>
                                                <td className="px-6 py-4 text-white">{bet.match_name}</td>
                                                <td className="px-6 py-4 text-white">{bet.bet_type}</td>
                                                <td className="px-6 py-4 text-white">₹{parseFloat(bet.amount).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-white">₹{parseFloat(bet.potential_return).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs ${bet.status === 'win' ? 'bg-green-500/20 text-green-400' :
                                                        bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {bet.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
