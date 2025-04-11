/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import ProfileSidebar from "@/components/shared/ProfileSidebar"
import { fetchUserProfile } from "@/lib/api"

interface DepositLog {
    id: string
    amount: string
    method: string
    status: number // Changed to number type
    transaction_id: string
    created_at: string
}

export default function DepositLogPage() {
    const [deposits, setDeposits] = useState<DepositLog[]>([])
    const [loading, setLoading] = useState(true)
    interface UserProfile {
        id: string
        name: string
        email: string
        // Add other fields as per the structure of the user profile
    }

    const [profile, setProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch both profile and deposit history
                const [profileData, depositHistory] = await Promise.all([
                    fetchUserProfile(),
                    fetchDepositHistory()
                ])
                setProfile(profileData)
                setDeposits(depositHistory.deposits || [])
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [])

    const fetchDepositHistory = async () => {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('https://book2500.funzip.in/api/deposit-log', {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        })
        const data = await response.json()
        return data
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        })
    }

    const getStatusDisplay = (status: string) => {
        if (status === "0") {
            return {
                text: 'Pending',
                className: 'bg-yellow-500/20 text-yellow-400'
            }
        } else if (status === "-1") {
            return {
                text: 'Failed',
                className: 'bg-red-500/20 text-red-400'
            }
        } else {
            return {
                text: 'Successful',
                className: 'bg-green-500/20 text-green-400'
            }
        }

    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid gap-6 md:grid-cols-12">
                <ProfileSidebar />
                <div className="md:col-span-9">
                    <div className="bg-brand-darkPurple rounded-lg shadow-xl p-4">
                        <h1 className="text-xl md:text-2xl font-bold text-white mb-4">Deposit History</h1>

                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
                                <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-brand-purple">
                                            <tr>
                                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                    Date
                                                </th>
                                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                    Amount
                                                </th>
                                                <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                    Method
                                                </th>
                                                <th scope="col" className="hidden sm:table-cell px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                    Transaction ID
                                                </th>
                                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {deposits.map((deposit) => (
                                                <tr key={deposit.id} className="hover:bg-purple-900/50">
                                                    <td className="whitespace-nowrap px-3 py-3 text-xs sm:text-sm text-white sm:px-4">
                                                        {formatDate(deposit.created_at)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-xs sm:text-sm text-white sm:px-4">
                                                        ₹{deposit.amount}
                                                        <div className="md:hidden text-[10px] text-gray-400 mt-1">
                                                            {deposit.method}
                                                        </div>
                                                    </td>
                                                    <td className="hidden md:table-cell whitespace-nowrap px-3 py-3 text-xs sm:text-sm text-white sm:px-4">
                                                        {deposit.method}
                                                    </td>
                                                    <td className="hidden sm:table-cell whitespace-nowrap px-3 py-3 text-xs sm:text-sm text-gray-300 sm:px-4">
                                                        {deposit.transaction_id}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-xs sm:text-sm sm:px-4">
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium 
                                                            ${getStatusDisplay(deposit.status.toString()).className}`}>
                                                            {getStatusDisplay(deposit.status.toString()).text}
                                                        </span>
                                                        <div className="sm:hidden text-[10px] text-gray-400 mt-1">
                                                            ID: {deposit.transaction_id}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
