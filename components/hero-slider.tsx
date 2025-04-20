"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Slide {
    id: number
    image_url: string
    status: string
}

export function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [slides, setSlides] = useState<Slide[]>([])
    const [loading, setLoading] = useState(true)
    const [touchStart, setTouchStart] = useState(0)
    const [touchEnd, setTouchEnd] = useState(0)
    // const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

    const startAutoPlay = useCallback(() => {
        if (slides.length === 0) return () => { };

        const interval = setInterval(() => {
            setCurrentSlide((current) =>
                current === slides.length - 1 ? 0 : current + 1
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [slides.length]);

    useEffect(() => {
        // Fetch slider data
        const fetchSlides = async () => {
            try {
                const response = await fetch("https://book2500.funzip.in/api/index")
                const data = await response.json()
                if (data.slider) {
                    setSlides(data.slider.filter((slide: Slide) => slide.status === "1"))
                }
            } catch (error) {
                console.error("Error fetching slides:", error)
                // Fallback slides if API fails
                setSlides([
                    { id: 1, image_url: "/placeholder.svg?height=500&width=1200", status: "1" },
                    { id: 2, image_url: "/placeholder.svg?height=500&width=1200", status: "1" },
                ])
            } finally {
                setLoading(false)
            }
        }

        fetchSlides()
    }, [])

    useEffect(() => {
        if (slides.length === 0) return

        const cleanup = startAutoPlay()
        return () => cleanup()
    }, [slides.length, startAutoPlay])

    const goToPrevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
    }

    const goToNextSlide = () => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }

    // Touch handlers for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 50) {
            // Swipe left
            goToNextSlide()
        }

        if (touchStart - touchEnd < -50) {
            // Swipe right
            goToPrevSlide()
        }
    }

    // Show loading or return null if no slides
    if (loading) {
        return (
            <div className="w-full h-[200px] sm:h-[300px] md:h-[400px] bg-[#2a1a47] flex items-center justify-center">
                <div className="animate-pulse text-white">Loading...</div>
            </div>
        )
    }

    if (slides.length === 0) {
        return null
    }

    return (
        <div
            className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"
                        }`}
                    aria-hidden={index !== currentSlide}
                >
                    <div className="relative h-full">
                        <Image
                            src={slide.image_url || "/placeholder.svg?height=500&width=1200"}
                            alt={`Slide ${slide.id}`}
                            fill

                            priority={index === currentSlide}
                            onError={(e) => {
                                // Fallback for broken images
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=500&width=1200"
                            }}
                        />
                    </div>
                </div>
            ))}

            {/* Navigation arrows */}
            <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full hidden sm:flex"
                onClick={goToPrevSlide}
                aria-label="Previous slide"
            >
                <ChevronLeft size={20} />
            </button>

            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full hidden sm:flex"
                onClick={goToNextSlide}
                aria-label="Next slide"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    )
}
