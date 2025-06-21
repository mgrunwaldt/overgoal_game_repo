import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

export interface UseImproveFameActionReturn {
	improveFameState: {
		isLoading: boolean;
		error: string | null;
		txStatus: string | null;
		txHash: string | null;
	};
	executeImproveFame: () => Promise<void>;
	canImproveFame: boolean;
}

export const useImproveFameAction = (): UseImproveFameActionReturn => {
	const { account, status } = useAccount();
	const { client } = useDojoSDK();
	const { 
		player, 
		updatePlayerFame, 
		updatePlayerCharisma 
	} = useAppStore();

	const [improveFameState, setImproveFameState] = useState({
		isLoading: false,
		error: null as string | null,
		txStatus: null as string | null,
		txHash: null as string | null,
	});

	// Check conditions
	const isConnected = status === "connected";
	const hasPlayer = player !== null;
	const isLoading = improveFameState.isLoading;
	const canImproveFame = isConnected && hasPlayer && !isLoading;

	const executeImproveFame = useCallback(async () => {
		if (!canImproveFame || !account) {
			setImproveFameState(prev => ({ ...prev, error: "Cannot improve fame right now" }));
			return;
		}

		try {
			setImproveFameState({ isLoading: true, error: null, txStatus: 'PENDING', txHash: null });

			// Optimistic update - must match contract logic: +5 fame, +5 charisma
			updatePlayerFame((player?.fame || 10) + 5);
			updatePlayerCharisma((player?.charisma || 10) + 5);

			console.log("📤 Executing improve fame transaction...");
			const tx = await client.game.improveFame(account as Account);

			if (tx?.transaction_hash) {
				setImproveFameState(prev => ({ ...prev, txHash: tx.transaction_hash }));
			}

			if (tx && tx.code === "SUCCESS") {
				setImproveFameState(prev => ({ ...prev, isLoading: false, error: null, txStatus: 'SUCCESS' }));

				// Auto-clear success state
				setTimeout(() => {
					setImproveFameState({ isLoading: false, error: null, txStatus: null, txHash: null });
				}, 3000);
			} else {
				throw new Error(`Transaction failed: ${tx?.code}`);
			}
		} catch (error: any) {
			console.error("❌ Improve fame failed:", error);

			// Rollback optimistic updates
			updatePlayerFame((player?.fame || 10) - 5);
			updatePlayerCharisma((player?.charisma || 10) - 5);

			setImproveFameState({
				isLoading: false,
				error: error.message || "Improve fame failed",
				txStatus: 'REJECTED',
				txHash: null,
			});

			// Auto-clear error state
			setTimeout(() => {
				setImproveFameState({ isLoading: false, error: null, txStatus: null, txHash: null });
			}, 5000);
		}
	}, [canImproveFame, account, client, player, updatePlayerFame, updatePlayerCharisma]);

	return {
		improveFameState,
		executeImproveFame,
		canImproveFame,
	};
}; 