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

	const build_game_spawnPlayer_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "spawn_player",
			calldata: [],
		};
	};

	const game_spawnPlayer = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount as any,
				build_game_spawnPlayer_calldata(),
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

	return {
		game: {
			mine: game_mine,
			buildMineCalldata: build_game_mine_calldata,
			rest: game_rest,
			buildRestCalldata: build_game_rest_calldata,
			spawnPlayer: game_spawnPlayer,
			buildSpawnPlayerCalldata: build_game_spawnPlayer_calldata,
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
		},
	};
}