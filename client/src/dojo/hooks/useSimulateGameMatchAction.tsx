import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

// Action state type
export type ActionState = 'idle' | 'executing' | 'success' | 'error';

export interface UseSimulateGameMatchActionReturn {
  simulateGameMatchState: ActionState;
  executeSimulateGameMatch: (matchId: number) => Promise<void>;
  canSimulateGameMatch: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSimulateGameMatchAction = (): UseSimulateGameMatchActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { updateGameMatch, updateTeamPoints } = useAppStore();
  
  // Local state
  const [simulateGameMatchState, setSimulateGameMatchState] = useState<ActionState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Computed states
  const isConnected = status === 'connected';
  const isLoading = simulateGameMatchState === 'executing';
  const canSimulateGameMatch = isConnected && !isLoading;

  const executeSimulateGameMatch = useCallback(async (matchId: number) => {
    if (!canSimulateGameMatch) {
      setError("Cannot simulate game match: wallet not connected or action in progress");
      return;
    }

    // Validation
    if (matchId <= 0) {
      setError("Match ID must be greater than 0");
      return;
    }

    setSimulateGameMatchState('executing');
    setError(null);

    try {
      console.log(`🎮 Simulating game match: ${matchId}`);

      // Execute blockchain transaction
      const tx = await client.game.simulateGamematch(account as Account, matchId);

      console.log("📋 Simulate game match transaction response:", tx);

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Game match simulated successfully!");
        setSimulateGameMatchState('success');
        
        // Reset to idle after success
        setTimeout(() => {
          setSimulateGameMatchState('idle');
        }, 2000);
      } else {
        throw new Error(`Transaction failed: ${tx?.code || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error("❌ Simulate game match error:", error);
      
      setSimulateGameMatchState('error');
      setError(error instanceof Error ? error.message : 'Failed to simulate game match');
      
      // Reset to idle after error
      setTimeout(() => {
        setSimulateGameMatchState('idle');
        setError(null);
      }, 3000);
    }
  }, [account, client, canSimulateGameMatch, updateGameMatch, updateTeamPoints]);

  return {
    simulateGameMatchState,
    executeSimulateGameMatch,
    canSimulateGameMatch,
    isLoading,
    error,
  };
}; 