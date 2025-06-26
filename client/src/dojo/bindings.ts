import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

// Player Type Enum
export enum PlayerType {
	Striker = 0,
	Dribbler = 1,
	Playmaker = 2,
}

// Type definition for `full_starter_react::models::player::Player` struct
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

// Type definition for `full_starter_react::models::player::PlayerValue` struct
export interface PlayerValue {
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

// Type definition for `achievement::events::index::TrophyCreation` struct
export interface TrophyCreation {
	id: number;
	hidden: boolean;
	index: number;
	points: number;
	start: number;
	end: number;
	group: number;
	icon: number;
	title: number;
	description: string;
	tasks: Array<Task>;
	data: string;
}

// Type definition for `achievement::events::index::TrophyCreationValue` struct
export interface TrophyCreationValue {
	hidden: boolean;
	index: number;
	points: number;
	start: number;
	end: number;
	group: number;
	icon: number;
	title: number;
	description: string;
	tasks: Array<Task>;
	data: string;
}

// Type definition for `achievement::events::index::TrophyProgression` struct
export interface TrophyProgression {
	player_id: number;
	task_id: number;
	count: number;
	time: number;
}

// Type definition for `achievement::events::index::TrophyProgressionValue` struct
export interface TrophyProgressionValue {
	count: number;
	time: number;
}

// Type definition for `achievement::types::index::Task` struct
export interface Task {
	id: number;
	total: number;
	description: string;
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

export interface NonMatchEvent {
    event_id: number;
    name: string;
    description: string;
    is_available: boolean;
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

export interface PlayerEventHistory {
    player: string;
    last_event_id: number;
    last_outcome_id: number;
    last_execution_timestamp: number;
}

export interface SchemaType extends ISchemaType {
	full_starter_react: {
		Player: Player,
		PlayerValue: PlayerValue,
		Team: Team,
		GameMatch: GameMatch,
		NonMatchEvent: NonMatchEvent,
		NonMatchEventOutcome: NonMatchEventOutcome,
		PlayerEventHistory: PlayerEventHistory,
	},
	achievement: {
		TrophyCreation: TrophyCreation,
		TrophyCreationValue: TrophyCreationValue,
		TrophyProgression: TrophyProgression,
		TrophyProgressionValue: TrophyProgressionValue,
		Task: Task,
	},
}
export const schema: SchemaType = {
	full_starter_react: {
		Player: {
			owner: "",
			experience: 0,
			health: 0,
			coins: 0,
			creation_day: 0,
			shoot: 0,
			dribble: 0,
			energy: 0,
			stamina: 0,
			charisma: 0,
			fame: 0,
			selected_team_id: 0,
			is_player_created: false,
			// ✅ ADD WITH DEFAULT VALUES
			is_injured: false,
			passing: 0,
			free_kick: 0,
			team_relationship: 0,
			intelligence: 0,
			player_type: PlayerType.Striker,
		},
		PlayerValue: {
			owner: "",
			experience: 0,
			health: 0,
			coins: 0,
			creation_day: 0,
			shoot: 0,
			dribble: 0,
			energy: 0,
			stamina: 0,
			charisma: 0,
			fame: 0,
		},
		        Team: {
            team_id: 0,
            name: "",
            offense: 0,
            defense: 0,
            intensity: 0,
            current_league_points: 0,
        },
        GameMatch: {
            match_id: 0,
            my_team_id: 0,
            opponent_team_id: 0,
            my_team_score: 0,
            opponent_team_score: 0,
            next_match_action: 0,
            next_match_action_minute: 0,
            current_time: 0,
            prev_time: 0,
            match_status: 0,
            player_participation: 0,
            action_team: 0,
		},
		NonMatchEvent: {
			event_id: 0,
			name: "",
			description: "",
			is_available: false,
		},
		NonMatchEventOutcome: {
			event_id: 0,
			outcome_id: 0,
			outcome_type: 0,
			name: "",
			description: "",
			coins_delta: 0,
			shoot_delta: 0,
			dribble_delta: 0,
			energy_delta: 0,
			stamina_delta: 0,
			charisma_delta: 0,
			fame_delta: 0,
			passing_delta: 0,
			free_kick_delta: 0,
			team_relationship_delta: 0,
			intelligence_delta: 0,
			sets_injured: false,
		},
		PlayerEventHistory: {
			player: "",
			last_event_id: 0,
			last_outcome_id: 0,
			last_execution_timestamp: 0,
		},
	},
	achievement: {
		TrophyCreation: {
			id: 0,
			hidden: false,
			index: 0,
			points: 0,
			start: 0,
			end: 0,
			group: 0,
			icon: 0,
			title: 0,
			description: "",
			tasks: [{ id: 0, total: 0, description: "", }],
			data: "",
		},
		TrophyCreationValue: {
			hidden: false,
			index: 0,
			points: 0,
			start: 0,
			end: 0,
			group: 0,
			icon: 0,
			title: 0,
			description: "",
			tasks: [{ id: 0, total: 0, description: "", }],
			data: "",
		},
		TrophyProgression: {
			player_id: 0,
			task_id: 0,
			count: 0,
			time: 0,
		},
		TrophyProgressionValue: {
			count: 0,
			time: 0,
		},
		Task: {
			id: 0,
			total: 0,
			description: "",
		},
	}
};
export enum ModelsMapping {
	Player = 'full_starter_react-Player',
	PlayerValue = 'full_starter_react-PlayerValue',
	Team = 'full_starter_react-Team',
	GameMatch = 'full_starter_react-GameMatch',
	NonMatchEvent = 'full_starter_react-NonMatchEvent',
	NonMatchEventOutcome = 'full_starter_react-NonMatchEventOutcome',
	PlayerEventHistory = 'full_starter_react-PlayerEventHistory',
	TrophyCreation = 'achievement-TrophyCreation',
	TrophyCreationValue = 'achievement-TrophyCreationValue',
	TrophyProgression = 'achievement-TrophyProgression',
	TrophyProgressionValue = 'achievement-TrophyProgressionValue',
	Task = 'achievement-Task',
}