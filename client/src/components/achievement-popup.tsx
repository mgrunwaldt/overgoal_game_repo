import { useEffect } from "react"
import { useGame } from "../context/game-context"
import { Trophy } from "lucide-react"

export function AchievementPopup() {
  const { state, dispatch } = useGame()

  useEffect(() => {
    if (state.achievement) {
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_ACHIEVEMENT" })
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [state.achievement, dispatch])

  if (!state.achievement) return null

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-4 rounded-xl shadow-2xl shadow-yellow-500/30 flex items-center gap-3 max-w-sm">
        <Trophy className="w-6 h-6" />
        <div>
          <div className="font-bold text-sm">Achievement Unlocked!</div>
          <div className="text-sm">{state.achievement}</div>
        </div>
      </div>
    </div>
  )
}
