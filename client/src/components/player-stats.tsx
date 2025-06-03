import { useGame } from "../context/game-context"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"

export function PlayerStats() {
  const { state } = useGame()

  const stats = [
    { label: "Level", value: state.level, color: "text-red-400" },
    { label: "Health", value: state.health, color: "text-green-400" },
    { label: "Coins", value: state.coins, color: "text-yellow-400" },
  ]

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-red-400 text-xl font-bold">Player Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between items-center">
            <span className="text-slate-300">{stat.label}</span>
            <span className={`font-bold text-lg ${stat.color}`}>{stat.value}</span>
          </div>
        ))}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Experience</span>
            <span className="text-blue-400 font-bold">
              {state.experience} / {state.maxExp}
            </span>
          </div>
          <Progress value={(state.experience / state.maxExp) * 100} className="h-2 bg-slate-700" />
        </div>
      </CardContent>
    </Card>
  )
}
