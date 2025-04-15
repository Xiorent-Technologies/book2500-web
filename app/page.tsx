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
      <div className="container mx-auto mb-7">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          <GameCard link="/cricket" title="CRICKET" imageSrc="/cricket.svg" />
          <GameCard link="/comming-soon" title="DRAGON" imageSrc="/games/dragon.svg" />
          <GameCard link="/comming-soon" title="TEEN PATTI" imageSrc="/games/teenPatti.svg" />
          <GameCard link="/comming-soon" title="MATKA" imageSrc="/games/mataka.svg" />
          <GameCard link="/comming-soon" title="POKER" imageSrc="/games/poker.svg" />

          {/* Aviator card with corrected alignment */}
          <div className="flex flex-col items-center justify-center gap-3">
            <Link href="/comming-soon">
              <Avatar className="w-[90px] h-[90px] md:w-[120px] md:h-[120px] cursor-pointer mb-3">
                <AvatarImage src="games/aviator.svg" alt="AVIATOR" className="p-[2px]" />
                <AvatarFallback>AVIATOR</AvatarFallback>
              </Avatar>
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
