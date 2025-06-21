import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface TrainEnergyActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseTrainEnergyActionReturn {
  trainEnergyState: TrainEnergyActionState;
  executeTrainEnergy: () => Promise<void>;
  canTrainEnergy: boolean;
  resetTrainEnergyState: () => void;
}

export const useTrainEnergyAction = (): UseTrainEnergyActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, updatePlayerEnergy, updatePlayerStamina } = useAppStore();

  const [trainEnergyState, setTrainEnergyState] = useState<TrainEnergyActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const hasEnoughStamina = (player?.stamina || 0) >= 10;
  const canTrainEnergy = isConnected && hasPlayer && hasEnoughStamina && !trainEnergyState.isLoading;

  const executeTrainEnergy = useCallback(async () => {
    if (!canTrainEnergy || !account) {
      const errorMsg = !account
        ? "Please connect your controller"
        : !hasEnoughStamina
          ? "Not enough stamina to train energy (need ≥10 stamina)"
          : "Cannot train energy right now";

      setTrainEnergyState(prev => ({ ...prev, error: errorMsg }));
      return;
    }

    try {
      setTrainEnergyState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log("📤 Executing train energy transaction...");

      const tx = await client.game.trainEnergy(account as Account);
      console.log("📥 Train energy transaction response:", tx);

      if (tx?.transaction_hash) {
        setTrainEnergyState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Train energy transaction successful!");

        // Optimistic update: +5 energy, -10 stamina
        updatePlayerEnergy((player?.energy || 40) + 5);
        updatePlayerStamina(Math.max(0, (player?.stamina) - 10));

        setTrainEnergyState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setTrainEnergyState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 3000);

      } else {
        throw new Error(`Train energy transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error executing train energy:", error);

      // Rollback optimistic update
      updatePlayerEnergy((player?.energy || 40) - 5);
      updatePlayerStamina(Math.min(100, (player?.stamina) + 10));

      setTrainEnergyState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setTrainEnergyState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 5000);
    }
  }, [canTrainEnergy, account, client.game, player, updatePlayerEnergy, updatePlayerStamina, hasEnoughStamina]);

  const resetTrainEnergyState = useCallback(() => {
    setTrainEnergyState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    trainEnergyState,
    executeTrainEnergy,
    canTrainEnergy,
    resetTrainEnergyState
  };
}; 