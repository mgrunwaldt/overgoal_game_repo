import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `full_starter_react::models::player::Player` struct
export interface Player {
	owner: string;
	experience: BigNumberish;
	health: BigNumberish;
	coins: BigNumberish;
	creation_day: BigNumberish;
	shoot: BigNumberish;
	dribble: BigNumberish;
	energy: BigNumberish;
	stamina: BigNumberish;
}

// Type definition for `full_starter_react::models::player::PlayerValue` struct
export interface PlayerValue {
	experience: BigNumberish;
	health: BigNumberish;
	coins: BigNumberish;
	creation_day: BigNumberish;
	shoot: BigNumberish;
	dribble: BigNumberish;
	energy: BigNumberish;
	stamina: BigNumberish;
}

// Type definition for `achievement::events::index::TrophyCreation` struct
export interface TrophyCreation {
	id: BigNumberish;
	hidden: boolean;
	index: BigNumberish;
	points: BigNumberish;
	start: BigNumberish;
	end: BigNumberish;
	group: BigNumberish;
	icon: BigNumberish;
	title: BigNumberish;
	description: string;
	tasks: Array<Task>;
	data: string;
}

// Type definition for `achievement::events::index::TrophyCreationValue` struct
export interface TrophyCreationValue {
	hidden: boolean;
	index: BigNumberish;
	points: BigNumberish;
	start: BigNumberish;
	end: BigNumberish;
	group: BigNumberish;
	icon: BigNumberish;
	title: BigNumberish;
	description: string;
	tasks: Array<Task>;
	data: string;
}

// Type definition for `achievement::events::index::TrophyProgression` struct
export interface TrophyProgression {
	player_id: BigNumberish;
	task_id: BigNumberish;
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::events::index::TrophyProgressionValue` struct
export interface TrophyProgressionValue {
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::types::index::Task` struct
export interface Task {
	id: BigNumberish;
	total: BigNumberish;
	description: string;
}

export interface SchemaType extends ISchemaType {
	full_starter_react: {
		Player: Player,
		PlayerValue: PlayerValue,
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
		},
		PlayerValue: {
			experience: 0,
			health: 0,
			coins: 0,
			creation_day: 0,
			shoot: 0,
			dribble: 0,
			energy: 0,
			stamina: 0,
		},
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
	},
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