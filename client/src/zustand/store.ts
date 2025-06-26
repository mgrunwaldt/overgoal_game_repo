import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Player Type Enum
export enum PlayerType {
  Striker = 0,
  Dribbler = 1,
  Playmaker = 2,
}

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
  // ✅ ADD NEW FIELDS
  is_injured: boolean;
  passing: number;
  free_kick: number;
  team_relationship: number;
  intelligence: number;
  player_type: PlayerType;  // ✅ ADD NEW FIELD
}

export interface Team {
  team_id: number;
  name: string;
  offense: number;
  defense: number;
  intensity: number;
  current_league_points: number;
}

export interface GameMatch {
  match_id: number;
  my_team_id: number;
  opponent_team_id: number;
  my_team_score: number;
  opponent_team_score: number;
  next_match_action: number;
  next_match_action_minute: number;
  current_time: number;
  prev_time: number;
  match_status: number;
  player_participation: number;
  action_team: number;
}

export enum MatchStatus {
  NotStarted = 0,
  InProgress = 1,
  HalfTime = 2,
  Finished = 3,
}

export enum MatchAction {
  OpenPlay = 0,
  Jumper = 1,
  Brawl = 2,
  FreeKick = 3,
  Penalty = 4,
  OpenDefense = 5,
  HalfTime = 6,      // 🆕 NEW
  MatchEnd = 7,      // 🆕 NEW
}

export enum MatchDecision {
  Dribble = 0,
  Pass = 1,
  Simulate = 2,
  Shoot = 3,
  StandingTackle = 4,
  SweepingTackle = 5,
  AcceptHug = 6,
  TackleFan = 7,
  JoinBrawl = 8,
  StayOut = 9,
}

export enum PlayerParticipation {
  NotParticipating = 0,
  Participating = 1,
  Observing = 2,
}

export enum ActionTeam {
  MyTeam = 0,
  OpponentTeam = 1,
  Neutral = 2,
}

export interface NonMatchEventOutcome {
  event_id: number;
  outcome_id: number;
  outcome_type: number;
  name: string;
  description: string;
  coins_delta: number;
  shoot_delta: number;
  dribble_delta: number;
  energy_delta: number;
  stamina_delta: number;
  charisma_delta: number;
  fame_delta: number;
  passing_delta: number;
  free_kick_delta: number;
  team_relationship_delta: number;
  intelligence_delta: number;
  sets_injured: boolean;
}

// Application state
interface AppState {
  // Player data
  player: Player | null;
  
  // Team data
  teams: Team[];
  selectedTeam: Team | null;
  
  // GameMatch data
  gameMatches: GameMatch[];
  currentMatch: GameMatch | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Game state
  gameStarted: boolean;
  last_non_match_outcome: NonMatchEventOutcome | null;
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
  // ✅ ADD UPDATE ACTIONS FOR NEW FIELDS
  updatePlayerInjuryStatus: (is_injured: boolean) => void;
  updatePlayerPassing: (passing: number) => void;
  updatePlayerFreeKick: (free_kick: number) => void;
  updatePlayerTeamRelationship: (team_relationship: number) => void;
  updatePlayerIntelligence: (intelligence: number) => void;
  updatePlayerType: (player_type: PlayerType) => void;  // ✅ ADD UPDATE ACTION
  
  // Team management actions
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: number, updates: Partial<Team>) => void;
  setSelectedTeam: (team: Team | null) => void;
  updateTeamPoints: (teamId: number, points: number) => void;
  
  // GameMatch actions
  setGameMatches: (matches: GameMatch[]) => void;
  addGameMatch: (match: GameMatch) => void;
  updateGameMatch: (matchId: number, updates: Partial<GameMatch>) => void;
  setCurrentMatch: (match: GameMatch | null) => void;
  updateMatchScore: (matchId: number, myScore: number, opponentScore: number) => void;
  updateMatchStatus: (matchId: number, status: number) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Game actions
  startGame: () => void;
  endGame: () => void;
  setLastNonMatchOutcome: (outcome: NonMatchEventOutcome | null) => void;
  
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
  gameMatches: [],
  currentMatch: null,
  isLoading: false,
  error: null,
  gameStarted: false,
  last_non_match_outcome: null,
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

      // ✅ IMPLEMENT ACTIONS FOR NEW FIELDS
      updatePlayerInjuryStatus: (is_injured) => set((state) => ({
        player: state.player ? { ...state.player, is_injured } : null
      })),

      updatePlayerPassing: (passing) => set((state) => ({
        player: state.player ? { ...state.player, passing } : null
      })),

      updatePlayerFreeKick: (free_kick) => set((state) => ({
        player: state.player ? { ...state.player, free_kick } : null
      })),

      updatePlayerTeamRelationship: (team_relationship) => set((state) => ({
        player: state.player ? { ...state.player, team_relationship } : null
      })),

      updatePlayerIntelligence: (intelligence) => set((state) => ({
        player: state.player ? { ...state.player, intelligence } : null
      })),

      updatePlayerType: (player_type) => set((state) => ({
        player: state.player ? { ...state.player, player_type } : null
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

      // GameMatch actions
      setGameMatches: (gameMatches) => set({ gameMatches }),

      addGameMatch: (match) => set((state) => ({
        gameMatches: [...state.gameMatches, match]
      })),

      updateGameMatch: (matchId, updates) => set((state) => ({
        gameMatches: state.gameMatches.map(match => 
          match.match_id === matchId ? { ...match, ...updates } : match
        ),
        currentMatch: state.currentMatch?.match_id === matchId 
          ? { ...state.currentMatch, ...updates } 
          : state.currentMatch
      })),

      setCurrentMatch: (match) => set({ currentMatch: match }),

      updateMatchScore: (matchId, myScore, opponentScore) => set((state) => ({
        gameMatches: state.gameMatches.map(match => 
          match.match_id === matchId 
            ? { ...match, my_team_score: myScore, opponent_team_score: opponentScore } 
            : match
        ),
        currentMatch: state.currentMatch?.match_id === matchId 
          ? { ...state.currentMatch, my_team_score: myScore, opponent_team_score: opponentScore }
          : state.currentMatch
      })),

      updateMatchStatus: (matchId, status) => set((state) => ({
        gameMatches: state.gameMatches.map(match => 
          match.match_id === matchId ? { ...match, match_status: status } : match
        ),
        currentMatch: state.currentMatch?.match_id === matchId 
          ? { ...state.currentMatch, match_status: status }
          : state.currentMatch
      })),

      // Game actions
      startGame: () => set({ gameStarted: true }),
      endGame: () => set({ gameStarted: false }),
      setLastNonMatchOutcome: (outcome) => set({ last_non_match_outcome: outcome }),

      // Utility actions
      resetStore: () => set(initialState),
    }),
    {
      name: 'dojo-starter-store',
      partialize: (state) => ({
        player: state.player,
        teams: state.teams,
        selectedTeam: state.selectedTeam,
        gameMatches: state.gameMatches,
        currentMatch: state.currentMatch,
        gameStarted: state.gameStarted,
        last_non_match_outcome: state.last_non_match_outcome, // ✅ FIX: Include in persistence
      }),
    }
  )
);

export default useAppStore;