"use client"

import { useState, useEffect } from "react"
import { PromoBanner } from "./promo-banner"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"

interface PromoBannerData {
    title: string
    imageSrc: string
    logoSrc: string
}

export function PromoCarousel() {
    const [api, setApi] = useState<CarouselApi>()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [current, setCurrent] = useState(0)

    const banners: PromoBannerData[] = [
        {
            title: "DRAGON TIGER",
            imageSrc: "/dragon-tiger.svg",
            logoSrc: "/logo.svg",
        },
        {
            title: "",
            imageSrc: "/worli-matka.svg",
            logoSrc: "/logo.svg",
        },
        {
            title: "",
            imageSrc: "/promosliderTeenPatti.svg",
            logoSrc: "/logo.svg",
        },
    ]

    useEffect(() => {
        if (!api) return

        const intervalId = setInterval(() => {
            api.scrollNext()
        }, 3000)

        // Update current slide index when scrolling
        const handleSelect = () => {
            setCurrent(api.selectedScrollSnap())
        }

        api.on("select", handleSelect)

        return () => {
            clearInterval(intervalId)
            api.off("select", handleSelect)
        }
    }, [api])

    return (
        <div className="w-full px-2 py-4 relative">
            <Carousel
                setApi={setApi}
                className="w-full"
                opts={{
                    loop: true,
                    align: "start",
                }}
            >
                <CarouselContent>
                    {banners.map((banner, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <PromoBanner title={banner.title} imageSrc={banner.imageSrc} logoSrc={banner.logoSrc} />
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 border-none text-white" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 border-none text-white" /> */}
            </Carousel>

            {/* <div className="flex justify-center gap-1 mt-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${current === index ? "bg-primary w-4" : "bg-gray-300"}`}
                        onClick={() => api?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div> */}
        </div>
    )
}
