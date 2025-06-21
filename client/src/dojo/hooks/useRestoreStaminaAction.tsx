import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface RestoreStaminaActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseRestoreStaminaActionReturn {
  restoreStaminaState: RestoreStaminaActionState;
  executeRestoreStamina: () => Promise<void>;
  canRestoreStamina: boolean;
  resetRestoreStaminaState: () => void;
}

export const useRestoreStaminaAction = (): UseRestoreStaminaActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, updatePlayerStamina } = useAppStore();

  const [restoreStaminaState, setRestoreStaminaState] = useState<RestoreStaminaActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const needsStaminaRestore = (player?.stamina || 100) < 100;
  const canRestoreStamina = isConnected && hasPlayer && needsStaminaRestore && !restoreStaminaState.isLoading;

  const executeRestoreStamina = useCallback(async () => {
    if (!canRestoreStamina || !account) {
      const errorMsg = !account
        ? "Please connect your controller"
        : !needsStaminaRestore
          ? "Stamina is already full!"
          : "Cannot restore stamina right now";

      setRestoreStaminaState(prev => ({ ...prev, error: errorMsg }));
      return;
    }

    try {
      setRestoreStaminaState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log("📤 Executing restore stamina transaction...");

      const tx = await client.game.restoreStamina(account as Account);
      console.log("📥 Restore stamina transaction response:", tx);

      if (tx?.transaction_hash) {
        setRestoreStaminaState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Restore stamina transaction successful!");

        // Optimistic update: +20 stamina (capped at 100)
        updatePlayerStamina(Math.min(100, (player?.stamina || 40) + 20));

        setRestoreStaminaState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setRestoreStaminaState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 3000);

      } else {
        throw new Error(`Restore stamina transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error executing restore stamina:", error);

      // Rollback optimistic update
      updatePlayerStamina(Math.max(0, (player?.stamina || 40) - 20));

      setRestoreStaminaState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setRestoreStaminaState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 5000);
    }
  }, [canRestoreStamina, account, client.game, player, updatePlayerStamina, needsStaminaRestore]);

  const resetRestoreStaminaState = useCallback(() => {
    setRestoreStaminaState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    restoreStaminaState,
    executeRestoreStamina,
    canRestoreStamina,
    resetRestoreStaminaState
  };
}; 