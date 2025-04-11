'use client'

import { useEffect, useState } from 'react'
import ProfileSidebar from "@/components/shared/ProfileSidebar"

interface Transaction {
    id: number
    trans_id: string
    description: string
    amount: string
    old_bal: string
    new_bal: string
    type: string | null
    status: string
    created_at: string
    title: string
    trx: string
    main_amo: string
    charge: string
}

interface TransactionResponse {
    page_title: string
    trans: {
        data: Transaction[]
        current_page: number
        last_page: number
        total: number
    }
    success: boolean
}

export default function TransactionLogPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            if (!token) throw new Error('Authentication required')

            const response = await fetch('https://book2500.funzip.in/api/transaction-log', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) throw new Error('Failed to fetch transactions')

            const data: TransactionResponse = await response.json()
            setTransactions(data.trans.data || [])
        } catch (error) {
            console.error('Failed to fetch transactions:', error)
            setTransactions([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto">
            <div className="grid gap-6 md:grid-cols-9 pt-6">
                <ProfileSidebar />
                <div className="md:col-span-9">
                    <div className="bg-brand-darkPurple rounded-lg shadow-xl p-4">
                        <h1 className="text-xl md:text-2xl font-bold text-white mb-4">Transaction History</h1>

                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="text-white">Loading transactions...</div>
                            </div>
                        ) : (
                            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
                                    <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-700">
                                            <thead className="bg-brand-purple">
                                                <tr>
                                                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                        Date
                                                    </th>
                                                    <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                        TRX
                                                    </th>
                                                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                        Amount
                                                    </th>
                                                    <th scope="col" className="hidden sm:table-cell px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                        Balance
                                                    </th>
                                                    {/* <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-300 sm:px-4">
                                                        Details
                                                    </th> */}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {transactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-purple-900/50">
                                                        <td className="whitespace-nowrap px-3 py-3 text-xs sm:text-sm text-white sm:px-4">
                                                            {new Date(tx.created_at).toLocaleDateString()}
                                                            <div className="md:hidden text-[10px] text-gray-400 mt-1">
                                                                {tx.trx}
                                                            </div>
                                                        </td>
                                                        <td className="hidden md:table-cell whitespace-nowrap px-3 py-3 text-xs sm:text-sm text-gray-300 sm:px-4">
                                                            {tx.trx}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-3 text-xs sm:text-sm sm:px-4">
                                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ${tx.type === '+'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                ₹{tx.amount}
                                                            </span>
                                                            <div className="sm:hidden text-[10px] text-gray-400 mt-1">
                                                                Balance: ₹{tx.new_bal}
                                                            </div>
                                                        </td>
                                                        <td className="hidden sm:table-cell whitespace-nowrap px-3 py-3 text-xs sm:text-sm text-white sm:px-4">
                                                            ₹{tx.new_bal}
                                                        </td>
                                                        {/* <td className="px-3 py-3 text-xs sm:text-sm text-gray-300 sm:px-4">
                                                            <div className="max-w-[150px] sm:max-w-xs truncate">
                                                                {tx.description}
                                                            </div>
                                                        </td> */}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
