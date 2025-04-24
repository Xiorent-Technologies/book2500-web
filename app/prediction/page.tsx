'use client'

import { useEffect, useState } from 'react'
import ProfileSidebar from "@/components/shared/ProfileSidebar"

interface Prediction {
    id: string
    match_name: string
    prediction_type: string
    odds: string
    confidence: string
    status: 'open' | 'closed'
    starts_at: string
}

export default function PredictionPage() {
    const [predictions, setPredictions] = useState<Prediction[]>([])

    useEffect(() => {
        fetchPredictions()
    }, [])

    const fetchPredictions = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            const response = await fetch('https://book2500.funzip.in/api/prediction', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            const data = await response.json()
            setPredictions(data.predictions || [])
        } catch (error) {
            console.error('Failed to fetch predictions:', error)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid gap-6 md:grid-cols-12">
                <ProfileSidebar />
                <div className="md:col-span-9">
                    <div className="bg-brand-darkPurple rounded-lg shadow-xl p-6">
                        <h1 className="text-2xl font-bold text-white mb-6">Expert Predictions</h1>

                        <div className="grid gap-4">
                            {predictions.map((prediction) => (
                                <div
                                    key={prediction.id}
                                    className="bg-brand-purple/20 rounded-lg p-4 border border-gray-700"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-white">{prediction.match_name}</h3>
                                        <span className={`px-2 py-1 rounded text-xs ${prediction.status === 'open'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {prediction.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-sm">Type</p>
                                            <p className="text-white">{prediction.prediction_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Odds</p>
                                            <p className="text-brand-gold font-semibold">{prediction.odds}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Confidence</p>
                                            <p className="text-green-400">{prediction.confidence}%</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Start Time</p>
                                            <p className="text-white">{prediction.starts_at}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
