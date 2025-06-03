import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useGame } from "../context/game-context"
import { Dumbbell, Hammer, Bed, Loader2 } from "lucide-react"

export function GameActions() {
  const { state, dispatch } = useGame()

  const executeAction = async (actionType: "TRAIN_PLAYER" | "MINE_COINS" | "REST_PLAYER", message: string) => {
    dispatch({ type: "SET_TX_STATUS", message: `${message}... Transaction pending`, txType: "pending" })

    setTimeout(() => {
      dispatch({ type: actionType })
      dispatch({ type: "SET_TX_STATUS", message: `${message} completed!`, txType: "success" })

      setTimeout(() => {
        dispatch({ type: "CLEAR_TX_STATUS" })
      }, 3000)
    }, 2000)
  }

  const actions = [
    {
      icon: Dumbbell,
      label: "Train",
      description: "+10 EXP",
      onClick: () => executeAction("TRAIN_PLAYER", "Training"),
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Hammer,
      label: "Mine",
      description: "+5 Coins",
      onClick: () => executeAction("MINE_COINS", "Mining"),
      color: "from-yellow-500 to-yellow-600",
    },
    {
      icon: Bed,
      label: "Rest",
      description: "+20 Health",
      onClick: () => executeAction("REST_PLAYER", "Resting"),
      color: "from-green-500 to-green-600",
    },
  ]

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-red-400 text-xl font-bold">Game Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.label}
              onClick={action.onClick}
              disabled={!state.connected || state.txStatus.type === "pending"}
              className={`w-full h-14 bg-gradient-to-r ${action.color} hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">{action.label}</span>
                <span className="text-xs opacity-80">{action.description}</span>
              </div>
            </Button>
          )
        })}

        {state.txStatus.message && (
          <div
            className={`p-4 rounded-lg border ${
              state.txStatus.type === "pending"
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                : state.txStatus.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {state.txStatus.type === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
              <span className="text-sm">{state.txStatus.message}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
