import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

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
	is_player_created: boolean;
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

export interface SchemaType extends ISchemaType {
	full_starter_react: {
		Player: Player,
		PlayerValue: PlayerValue,
		Team: Team,
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
			is_player_created: false,
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
	TrophyCreation = 'achievement-TrophyCreation',
	TrophyCreationValue = 'achievement-TrophyCreationValue',
	TrophyProgression = 'achievement-TrophyProgression',
	TrophyProgressionValue = 'achievement-TrophyProgressionValue',
	Task = 'achievement-Task',
}