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
  selected_team_id: number;
  is_player_created: boolean;
}

export interface Team {
  team_id: number;
  name: string;
  offense: number;
  defense: number;
  intensity: number;
  current_league_points: number;
}

// Application state
interface AppState {
  // Player data
  player: Player | null;
  
  // Team data
  teams: Team[];
  selectedTeam: Team | null;
  
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
  updatePlayerSelectedTeam: (selected_team_id: number) => void;
  updatePlayerCreationStatus: (is_player_created: boolean) => void;
  
  // Team management actions
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: number, updates: Partial<Team>) => void;
  setSelectedTeam: (team: Team | null) => void;
  updateTeamPoints: (teamId: number, points: number) => void;
  
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
  teams: [],
  selectedTeam: null,
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

      updatePlayerSelectedTeam: (selected_team_id) => set((state) => ({
        player: state.player ? { ...state.player, selected_team_id } : null
      })),

      updatePlayerCreationStatus: (is_player_created) => set((state) => ({
        player: state.player ? { ...state.player, is_player_created } : null
      })),

      // Team actions
      setTeams: (teams) => set({ teams }),

      addTeam: (team) => set((state) => ({
        teams: [...state.teams, team]
      })),

      updateTeam: (teamId, updates) => set((state) => ({
        teams: state.teams.map(team => 
          team.team_id === teamId ? { ...team, ...updates } : team
        ),
        selectedTeam: state.selectedTeam?.team_id === teamId 
          ? { ...state.selectedTeam, ...updates } 
          : state.selectedTeam
      })),

      setSelectedTeam: (team) => set({ selectedTeam: team }),

      updateTeamPoints: (teamId, points) => set((state) => ({
        teams: state.teams.map(team => 
          team.team_id === teamId ? { ...team, current_league_points: points } : team
        ),
        selectedTeam: state.selectedTeam?.team_id === teamId 
          ? { ...state.selectedTeam, current_league_points: points }
          : state.selectedTeam
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
        teams: state.teams,
        selectedTeam: state.selectedTeam,
        gameStarted: state.gameStarted,
      }),
    }
  )
);

export default useAppStore;