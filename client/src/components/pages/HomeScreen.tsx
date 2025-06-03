import { Header } from "../header"
import { StatusBar } from "../status-bar"
import { GameSection } from "../game-section"
import { LinksSection } from "../links-section"
import { AchievementPopup } from "../achievement-popup"
import { GameProvider } from "../../context/game-context"

export default function HomePage() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Header />
          <StatusBar />
          <GameSection />
          <LinksSection />
          <AchievementPopup />
        </div>
      </div>
    </GameProvider>
  )
}
