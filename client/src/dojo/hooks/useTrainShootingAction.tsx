import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface TrainShootingActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseTrainShootingActionReturn {
  trainShootingState: TrainShootingActionState;
  executeTrainShooting: () => Promise<void>;
  canTrainShooting: boolean;
  resetTrainShootingState: () => void;
}

export const useTrainShootingAction = (): UseTrainShootingActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, updatePlayerShooting, updatePlayerExperience, updatePlayerStamina } = useAppStore();

  const [trainShootingState, setTrainShootingState] = useState<TrainShootingActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const hasEnoughStamina = (player?.stamina || 0) >= 10;
  const canTrainShooting = isConnected && hasPlayer && hasEnoughStamina && !trainShootingState.isLoading;

  const executeTrainShooting = useCallback(async () => {
    if (!canTrainShooting || !account) {
      const errorMsg = !account
        ? "Please connect your controller"
        : !hasEnoughStamina
          ? "Not enough stamina to train shooting (need ≥10 stamina)"
          : "Cannot train shooting right now";

      setTrainShootingState(prev => ({ ...prev, error: errorMsg }));
      return;
    }

    try {
      setTrainShootingState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log("📤 Executing train shooting transaction...");

      const tx = await client.game.trainShooting(account as Account);
      console.log("📥 Train shooting transaction response:", tx);

      if (tx?.transaction_hash) {
        setTrainShootingState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Train shooting transaction successful!");

        // Optimistic update: +5 shooting, +5 experience, -10 stamina
        updatePlayerShooting((player?.shoot || 10) + 5);
        updatePlayerExperience((player?.experience || 0) + 5);
        updatePlayerStamina(Math.max(0, (player?.stamina) - 10));

        setTrainShootingState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setTrainShootingState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 3000);

      } else {
        throw new Error(`Train shooting transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error executing train shooting:", error);

      // Rollback optimistic update
      updatePlayerShooting((player?.shoot || 10) - 5);
      updatePlayerExperience((player?.experience || 0) - 5);
      updatePlayerStamina(Math.min(100, (player?.stamina) + 10));

      setTrainShootingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setTrainShootingState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 5000);
    }
  }, [canTrainShooting, account, client.game, player, updatePlayerShooting, updatePlayerExperience, updatePlayerStamina, hasEnoughStamina]);

  const resetTrainShootingState = useCallback(() => {
    setTrainShootingState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    trainShootingState,
    executeTrainShooting,
    canTrainShooting,
    resetTrainShootingState
  };
}; 