import { Suspense } from 'react'
import OtpVerificationForm from './components/OtpVerificationForm'

export default function VerifyOtpPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[calc(100vh-136px)] items-center justify-center">
                    <div className="text-white">Loading...</div>
                </div>
            }
        >
            <OtpVerificationForm />
        </Suspense>
    )
}
