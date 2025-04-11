"use client"

import { useEffect, useRef } from "react"

interface VideoStreamProps {
    matchId: string
}

export function VideoStream({ matchId }: VideoStreamProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Handle any messages from the iframe if needed
            if (event.origin === "https://tvapp.1ten.live" && event.data) {
                console.log("Message from stream:", event.data)
            }
        }

        window.addEventListener("message", handleMessage)
        return () => window.removeEventListener("message", handleMessage)
    }, [])

    return (
        <div className="w-full h-full bg-black relative">
            <iframe
                ref={iframeRef}
                src={`https://tvapp.1ten.live/event-play-2/${matchId}`}
                className="w-full h-full border-0"
                allow="fullscreen"
                allowFullScreen
            />
        </div>
    )
}
