"use client";

import { useEffect, useRef } from "react";

interface VideoStreamProps {
  tvUrl: string;
}

export function VideoStream({ tvUrl }: VideoStreamProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === "https://tvapp.1ten.live" && event.data) {
        // console.log("Message from stream:", event.data)
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="w-full h-full bg-black relative">
      <iframe
        ref={iframeRef}
        src={tvUrl}
        className="w-full h-full border-0"
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}
