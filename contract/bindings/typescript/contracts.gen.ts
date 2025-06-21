import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

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
				snAccount,
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
				snAccount,
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
				snAccount,
				build_game_spawnPlayer_calldata(),
				"full_starter_react",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_train_calldata = (): DojoCall => {
		return {
			contractName: "game",
			entrypoint: "train",
			calldata: [],
		};
	};

	const game_train = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_train_calldata(),
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
				snAccount,
				build_game_trainDribbling_calldata(),
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
				snAccount,
				build_game_trainEnergy_calldata(),
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
				snAccount,
				build_game_trainShooting_calldata(),
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
			train: game_train,
			buildTrainCalldata: build_game_train_calldata,
			trainDribbling: game_trainDribbling,
			buildTrainDribblingCalldata: build_game_trainDribbling_calldata,
			trainEnergy: game_trainEnergy,
			buildTrainEnergyCalldata: build_game_trainEnergy_calldata,
			trainShooting: game_trainShooting,
			buildTrainShootingCalldata: build_game_trainShooting_calldata,
		},
	};
}