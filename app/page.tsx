import { GameCard } from "@/components/game-card"
import { NavigationTabs } from "@/components/navigation-tabs"
import { PromoBanner } from "@/components/promo-banner"
import { CategoryBanners } from "@/components/category-banners"
import { CricketSection } from "@/components/cricket-section"
import { HeroSlider } from "@/components/hero-slider"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#2a1a47]">
      {/* Hero Banner */}
      <div className="w-full relative">
        {/* Hero Banner */}
        <HeroSlider />
      </div>

      {/* Game Promotions */}
      <div className="w-full px-2 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PromoBanner
            title="DRAGON TIGER"
            imageSrc="/dragon-tiger.svg"
            logoSrc="/logo.svg"
          />
          <PromoBanner title="" imageSrc="/worli-matka.svg" logoSrc="/logo.svg" />
        </div>
      </div>

      {/* Game Categories */}
      <div className="w-full px-2 py-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          <GameCard link="/cricket" title="CRICKET" imageSrc="/cricket.svg" />
          <GameCard link="/" title="AVIATOR" imageSrc="games/aviator.svg" />
          <GameCard link="/" title="DRAGON" imageSrc="/games/dragon.svg" />
          <GameCard link="/" title="TEEN PATTI" imageSrc="/games/teenPatti.svg" />
          <GameCard link="/" title="MATKA" imageSrc="/games/mataka.svg" />
          <GameCard link="/" title="POKER" imageSrc="/games/poker.svg" />
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
