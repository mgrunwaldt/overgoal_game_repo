import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"

interface GameState {
  connected: boolean
  level: number
  experience: number
  maxExp: number
  health: number
  coins: number
  energy: number
  stamina: number
  shoot: number
  dribble: number
  address: string | null
  isLoading: boolean
  txStatus: {
    message: string
    type: "pending" | "success" | "error" | null
  }
  achievement: string | null
}

type GameAction =
  | { type: "CONNECT_WALLET_START" }
  | { type: "CONNECT_WALLET_SUCCESS"; address: string }

  | { type: "MINE_COINS" }
  | { type: "TRAIN_ENERGY" }
  | { type: "TRAIN_DRIBBLING" }
  | { type: "ADD_STAMINA" }
  | { type: "REMOVE_STAMINA" }
  | { type: "TRAIN_SHOOTING" }
  | { type: "REST_PLAYER" }
  | { type: "SET_TX_STATUS"; message: string; txType: "pending" | "success" | "error" }
  | { type: "CLEAR_TX_STATUS" }
  | { type: "SHOW_ACHIEVEMENT"; achievement: string }
  | { type: "CLEAR_ACHIEVEMENT" }

const initialState: GameState = {
  connected: false,
  level: 1,
  experience: 0,
  maxExp: 100,
  health: 100,
  coins: 0,
  energy: 40,
  stamina: 40,
  shoot: 10,
  dribble: 10,
  address: null,
  isLoading: false,
  txStatus: { message: "", type: null },
  achievement: null,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CONNECT_WALLET_START":
      return { ...state, isLoading: true }

    case "CONNECT_WALLET_SUCCESS":
      return {
        ...state,
        connected: true,
        address: action.address,
        isLoading: false,
      }

    case "MINE_COINS":
      const newCoins = state.coins + 5
      return {
        ...state,
        coins: newCoins,
        health: Math.max(0, state.health - 5),
        achievement: newCoins >= 50 && state.coins < 50 ? "Wealthy Miner!" : state.achievement,
      }

    case "TRAIN_ENERGY":
      return {
        ...state,
        energy: state.energy + 10,
        stamina: state.stamina - 10,
      }

    case "TRAIN_DRIBBLING":
      return {
        ...state,
        dribble: state.dribble + 5,
      }

    case "TRAIN_SHOOTING":
      return {
        ...state,
        shoot: state.shoot + 5,
      }

    case "ADD_STAMINA":
      return {
        ...state,
        stamina: state.stamina + 10,
      }

    case "REMOVE_STAMINA":
      return {
        ...state,
        stamina: state.stamina - 10,
      }

    case "REST_PLAYER":
      return {
        ...state,
        health: Math.min(100, state.health + 20),
      }

    case "SET_TX_STATUS":
      return {
        ...state,
        txStatus: { message: action.message, type: action.txType },
      }

    case "CLEAR_TX_STATUS":
      return {
        ...state,
        txStatus: { message: "", type: null },
      }

    case "SHOW_ACHIEVEMENT":
      return {
        ...state,
        achievement: action.achievement,
      }

    case "CLEAR_ACHIEVEMENT":
      return {
        ...state,
        achievement: null,
      }

    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
