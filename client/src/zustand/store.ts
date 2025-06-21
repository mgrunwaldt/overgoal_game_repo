import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interface matching your bindings
export interface Player {
  owner: string;          
  experience: number;
  health: number;
  coins: number;
  creation_day: number;
  shoot: number;
  dribble: number;
  energy: number;
  stamina: number;
  charisma: number;
  fame: number;
}

// Application state
interface AppState {
  // Player data
  player: Player | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Game state
  gameStarted: boolean;
}

// Store actions
interface AppActions {
  // Player actions
  setPlayer: (player: Player | null) => void;
  updatePlayerCoins: (coins: number) => void;
  updatePlayerExperience: (experience: number) => void;
  updatePlayerHealth: (health: number) => void;
  updatePlayerShooting: (shoot: number) => void;
  updatePlayerDribbling: (dribble: number) => void;
  updatePlayerEnergy: (energy: number) => void;
  updatePlayerStamina: (stamina: number) => void;
  updatePlayerCharisma: (charisma: number) => void;
  updatePlayerFame: (fame: number) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Game actions
  startGame: () => void;
  endGame: () => void;
  
  // Utility actions
  resetStore: () => void;
}

// Combine state and actions
type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  player: null,
  isLoading: false,
  error: null,
  gameStarted: false,
};

// Create the store
const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Player actions
      setPlayer: (player) => set({ player }),
      
      updatePlayerCoins: (coins) => set((state) => ({
        player: state.player ? { ...state.player, coins } : null
      })),
      
      updatePlayerExperience: (experience) => set((state) => ({
        player: state.player ? { ...state.player, experience } : null
      })),

      updatePlayerHealth: (health) => set((state) => ({
        player: state.player ? { ...state.player, health } : null
      })),

      updatePlayerShooting: (shoot) => set((state) => ({
        player: state.player ? { ...state.player, shoot } : null
      })),

      updatePlayerDribbling: (dribble) => set((state) => ({
        player: state.player ? { ...state.player, dribble } : null
      })),

      updatePlayerEnergy: (energy) => set((state) => ({
        player: state.player ? { ...state.player, energy } : null
      })),

      updatePlayerStamina: (stamina) => set((state) => ({
        player: state.player ? { ...state.player, stamina } : null
      })),

      updatePlayerCharisma: (charisma) => set((state) => ({
        player: state.player ? { ...state.player, charisma } : null
      })),

      updatePlayerFame: (fame) => set((state) => ({
        player: state.player ? { ...state.player, fame } : null
      })),

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Game actions
      startGame: () => set({ gameStarted: true }),
      endGame: () => set({ gameStarted: false }),

      // Utility actions
      resetStore: () => set(initialState),
    }),
    {
      name: 'dojo-starter-store',
      partialize: (state) => ({
        player: state.player,
        gameStarted: state.gameStarted,
      }),
    }
  )
);

export default useAppStore;