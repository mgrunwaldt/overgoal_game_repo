import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface } from "starknet";

export function setupWorld(provider: DojoProvider) {

	const build_game_mine_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "mine",
			calldata: [],
		};
	};

	const game_mine = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_mine_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_rest_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "rest",
			calldata: [],
		};
	};

	const game_rest = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_rest_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_markPlayerAsCreated_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "mark_player_as_created",
			calldata: [],
		};
	};

	const game_markPlayerAsCreated = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_markPlayerAsCreated_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_trainShooting_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "train_shooting",
			calldata: [],
		};
	};

	const game_trainShooting = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_trainShooting_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_trainEnergy_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "train_energy",
			calldata: [],
		};
	};

	const game_trainEnergy = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_trainEnergy_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_trainDribbling_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "train_dribbling",
			calldata: [],
		};
	};

	const game_trainDribbling = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_trainDribbling_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_restoreStamina_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "restore_stamina",
			calldata: [],
		};
	};

	const game_restoreStamina = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_restoreStamina_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_improveCharisma_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "improve_charisma",
			calldata: [],
		};
	};

	const game_improveCharisma = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_improveCharisma_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_improveFame_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "improve_fame",
			calldata: [],
		};
	};

	const game_improveFame = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_improveFame_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// --------- Archetype spawn functions ---------
	const build_game_spawnStriker_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "spawn_striker",
			calldata: [],
		};
	};

	const game_spawnStriker = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_spawnStriker_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_spawnDribbler_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "spawn_dribbler",
			calldata: [],
		};
	};

	const game_spawnDribbler = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_spawnDribbler_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_spawnPlaymaker_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "spawn_playmaker",
			calldata: [],
		};
	};

	const game_spawnPlaymaker = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_spawnPlaymaker_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// --------- Team management functions ---------
	const build_game_createTeam_calldata = (team_id: number, name: string, offense: number, defense: number, intensity: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "create_team",
			calldata: [team_id, name, offense, defense, intensity],
		};
	};

	const game_createTeam = async (snAccount: Account | AccountInterface, team_id: number, name: string, offense: number, defense: number, intensity: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_createTeam_calldata(team_id, name, offense, defense, intensity),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_addTeamPoints_calldata = (team_id: number, points: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "add_team_points",
			calldata: [team_id, points],
		};
	};

	const game_addTeamPoints = async (snAccount: Account | AccountInterface, team_id: number, points: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_addTeamPoints_calldata(team_id, points),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_removeTeamPoints_calldata = (team_id: number, points: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "remove_team_points",
			calldata: [team_id, points],
		};
	};

	const game_removeTeamPoints = async (snAccount: Account | AccountInterface, team_id: number, points: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_removeTeamPoints_calldata(team_id, points),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_updateTeamPoints_calldata = (team_id: number, points_delta: number): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "update_team_points",
			calldata: [team_id, points_delta],
		};
	};

	const game_updateTeamPoints = async (snAccount: Account | AccountInterface, team_id: number, points_delta: number) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_updateTeamPoints_calldata(team_id, points_delta),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	return {
		game: {
			mine: game_mine,
			buildMineCalldata: build_game_mine_calldata,
			rest: game_rest,
			buildRestCalldata: build_game_rest_calldata,
			markPlayerAsCreated: game_markPlayerAsCreated,
			buildMarkPlayerAsCreatedCalldata: build_game_markPlayerAsCreated_calldata,
			trainShooting: game_trainShooting,
			buildTrainShootingCalldata: build_game_trainShooting_calldata,
			trainEnergy: game_trainEnergy,
			buildTrainEnergyCalldata: build_game_trainEnergy_calldata,
			trainDribbling: game_trainDribbling,
			buildTrainDribblingCalldata: build_game_trainDribbling_calldata,
			restoreStamina: game_restoreStamina,
			buildRestoreStaminaCalldata: build_game_restoreStamina_calldata,
			improveCharisma: game_improveCharisma,
			buildImproveCharismaCalldata: build_game_improveCharisma_calldata,
			improveFame: game_improveFame,
			buildImproveFameCalldata: build_game_improveFame_calldata,
			// --------- Archetype spawn functions ---------
			spawnStriker: game_spawnStriker,
			buildSpawnStrikerCalldata: build_game_spawnStriker_calldata,
			spawnDribbler: game_spawnDribbler,
			buildSpawnDribblerCalldata: build_game_spawnDribbler_calldata,
			spawnPlaymaker: game_spawnPlaymaker,
			buildSpawnPlaymakerCalldata: build_game_spawnPlaymaker_calldata,
			// Team management functions
			createTeam: game_createTeam,
			buildCreateTeamCalldata: build_game_createTeam_calldata,
			addTeamPoints: game_addTeamPoints,
			buildAddTeamPointsCalldata: build_game_addTeamPoints_calldata,
			removeTeamPoints: game_removeTeamPoints,
			buildRemoveTeamPointsCalldata: build_game_removeTeamPoints_calldata,
			updateTeamPoints: game_updateTeamPoints,
			buildUpdateTeamPointsCalldata: build_game_updateTeamPoints_calldata,
		},
	};
}