import { Button } from "./ui/button"
import { useGame } from "../context/game-context"
import { Loader2, Wallet, CheckCircle } from "lucide-react"

export function StatusBar() {
  const { state, dispatch } = useGame()

  const connectWallet = async () => {
    dispatch({ type: "CONNECT_WALLET_START" })
    dispatch({ type: "SET_TX_STATUS", message: "Connecting wallet...", txType: "pending" })

    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = "0x1234...5678"
      dispatch({ type: "CONNECT_WALLET_SUCCESS", address: mockAddress })
      dispatch({ type: "SET_TX_STATUS", message: "Wallet connected successfully!", txType: "success" })

      setTimeout(() => {
        dispatch({ type: "CLEAR_TX_STATUS" })
      }, 3000)
    }, 1500)
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={connectWallet}
            disabled={state.isLoading || state.connected}
            className={`px-6 py-3 font-semibold transition-all duration-300 ${
              state.connected
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30"
            }`}
          >
            {state.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : state.connected ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Connected
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
          {state.address && (
            <span className="text-slate-300 font-mono text-sm bg-slate-800/50 px-3 py-1 rounded-lg">
              {state.address}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-slate-300">Deployed on Sepolia</span>
        </div>
      </div>
    </div>
  )
}
