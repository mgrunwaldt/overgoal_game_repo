import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface TrainDribblingActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseTrainDribblingActionReturn {
  trainDribblingState: TrainDribblingActionState;
  executeTrainDribbling: () => Promise<void>;
  canTrainDribbling: boolean;
  resetTrainDribblingState: () => void;
}

export const useTrainDribblingAction = (): UseTrainDribblingActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, updatePlayerDribbling } = useAppStore();

  const [trainDribblingState, setTrainDribblingState] = useState<TrainDribblingActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const canTrainDribbling = isConnected && hasPlayer && !trainDribblingState.isLoading;

  const executeTrainDribbling = useCallback(async () => {
    if (!canTrainDribbling || !account) {
      setTrainDribblingState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : "Cannot train dribbling right now"
      }));
      return;
    }

    try {
      setTrainDribblingState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log("📤 Executing train dribbling transaction...");

      const tx = await client.game.trainDribbling(account as Account);
      console.log("📥 Train dribbling transaction response:", tx);

      if (tx?.transaction_hash) {
        setTrainDribblingState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Train dribbling transaction successful!");

        // Optimistic update: +5 dribbling, +5 experience
        updatePlayerDribbling((player?.dribble || 0) + 5);

        setTrainDribblingState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setTrainDribblingState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 3000);

      } else {
        throw new Error(`Train dribbling transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error executing train dribbling:", error);

      setTrainDribblingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setTrainDribblingState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 5000);
    }
  }, [canTrainDribbling, account, client.game, player, updatePlayerDribbling]);

  const resetTrainDribblingState = useCallback(() => {
    setTrainDribblingState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    trainDribblingState,
    executeTrainDribbling,
    canTrainDribbling,
    resetTrainDribblingState
  };
}; 