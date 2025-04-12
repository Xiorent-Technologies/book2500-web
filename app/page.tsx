import { GameCard } from "@/components/game-card"
import { NavigationTabs } from "@/components/navigation-tabs"
// import { PromoBanner } from "@/components/promo-banner"
import { CategoryBanners } from "@/components/category-banners"
import { CricketSection } from "@/components/cricket-section"
import { HeroSlider } from "@/components/hero-slider"
import { PromoCarousel } from "@/components/promo-card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#2a1a47]">
      {/* Hero Banner */}
      <HeroSlider />

      {/* Game Promotions */}
      <PromoCarousel />

      {/* Game Categories */}
      <div className="container mx-auto  mb-7">
        {/* <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6"> */}
        <div className="flex items-center justify-between flex-row flex-wrap">
          <GameCard link="/cricket" title="CRICKET" imageSrc="/cricket.svg" />
          {/* <GameCard link="/" title="AVIATOR" imageSrc="games/aviator.svg" /> */}
          <GameCard link="/comming-soon" title="DRAGON" imageSrc="/games/dragon.svg" />
          <GameCard link="/comming-soon" title="TEEN PATTI" imageSrc="/games/teenPatti.svg" />
          <GameCard link="/comming-soon" title="MATKA" imageSrc="/games/mataka.svg" />
          <GameCard link="/comming-soon" title="POKER" imageSrc="/games/poker.svg" />

          <div className="flex flex-col items-center mx-[40px]">

            <Link href="/comming-soon" className="block mb-2">

              <div className="w-32 h-32 md:w-36 md:h-36 mb-7">
                <Avatar className=" cursor-pointer">
                  <div className=" mt-2 p-[2px]">
                    <AvatarImage src="games/aviator.svg" alt="AVIATOR" />
                  </div>
                  <AvatarFallback>AVIATOR</AvatarFallback>
                </Avatar>
              </div>
            </Link>

            <h3 className="text-white font-bold text-sm md:text-lg text-center">AVIATOR</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <NavigationTabs />

      {/* Category Banners */}
      <CategoryBanners />

      {/* Cricket Section */}
      <CricketSection />
    </main>
  )
}
