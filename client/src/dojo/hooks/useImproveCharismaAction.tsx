import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

export interface UseImproveCharismaActionReturn {
	improveCharismaState: {
		isLoading: boolean;
		error: string | null;
		txStatus: string | null;
		txHash: string | null;
	};
	executeImproveCharisma: () => Promise<void>;
	canImproveCharisma: boolean;
}

export const useImproveCharismaAction = (): UseImproveCharismaActionReturn => {
	const { account, status } = useAccount();
	const { client } = useDojoSDK();
	const { 
		player, 
		updatePlayerCharisma, 
		updatePlayerStamina 
	} = useAppStore();

	const [improveCharismaState, setImproveCharismaState] = useState({
		isLoading: false,
		error: null as string | null,
		txStatus: null as string | null,
		txHash: null as string | null,
	});

	// Check conditions
	const isConnected = status === "connected";
	const hasPlayer = player !== null;
	const hasEnoughStamina = (player?.stamina || 0) > 5;
	const isLoading = improveCharismaState.isLoading;
	const canImproveCharisma = isConnected && hasPlayer && hasEnoughStamina && !isLoading;

	const executeImproveCharisma = useCallback(async () => {
		if (!canImproveCharisma || !account) {
			setImproveCharismaState(prev => ({ ...prev, error: "Cannot improve charisma right now" }));
			return;
		}

		try {
			setImproveCharismaState({ isLoading: true, error: null, txStatus: 'PENDING', txHash: null });

			// Optimistic update - must match contract logic: +5 charisma, -5 stamina
			updatePlayerCharisma((player?.charisma || 10) + 5);
			updatePlayerStamina(Math.max(0, (player?.stamina || 40) - 5));

			console.log("📤 Executing improve charisma transaction...");
			const tx = await client.game.improveCharisma(account as Account);

			if (tx?.transaction_hash) {
				setImproveCharismaState(prev => ({ ...prev, txHash: tx.transaction_hash }));
			}

			if (tx && tx.code === "SUCCESS") {
				setImproveCharismaState(prev => ({ ...prev, isLoading: false, error: null, txStatus: 'SUCCESS' }));

				// Auto-clear success state
				setTimeout(() => {
					setImproveCharismaState({ isLoading: false, error: null, txStatus: null, txHash: null });
				}, 3000);
			} else {
				throw new Error(`Transaction failed: ${tx?.code}`);
			}
		} catch (error: any) {
			console.error("❌ Improve charisma failed:", error);

			// Rollback optimistic updates
			updatePlayerCharisma((player?.charisma || 10) - 5);
			updatePlayerStamina(Math.min(100, (player?.stamina || 40) + 5));

			setImproveCharismaState({
				isLoading: false,
				error: error.message || "Improve charisma failed",
				txStatus: 'REJECTED',
				txHash: null,
			});

			// Auto-clear error state
			setTimeout(() => {
				setImproveCharismaState({ isLoading: false, error: null, txStatus: null, txHash: null });
			}, 5000);
		}
	}, [canImproveCharisma, account, client, player, updatePlayerCharisma, updatePlayerStamina]);

	return {
		improveCharismaState,
		executeImproveCharisma,
		canImproveCharisma,
	};
}; 