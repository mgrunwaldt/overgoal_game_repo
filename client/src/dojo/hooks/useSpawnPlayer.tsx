import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import { usePlayer } from "./usePlayer";
import useAppStore from "../../zustand/store";

// Types
interface InitializeState {
  isInitializing: boolean;
  error: string | null;
  completed: boolean;
  step: 'checking' | 'spawning' | 'loading' | 'success' | 'needs_character_selection';
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface InitializeResponse {
  success: boolean;
  playerExists: boolean;
  needsCharacterSelection?: boolean;
  transactionHash?: string;
  error?: string;
}

export const useSpawnPlayer = () => {
  const { useDojoStore, client } = useDojoSDK();
  const dojoState = useDojoStore((state) => state);
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { player, isLoading: playerLoading, refetch: refetchPlayer } = usePlayer();
  const { setLoading } = useAppStore();

  // Local state
  const [initState, setInitState] = useState<InitializeState>({
    isInitializing: false,
    error: null,
    completed: false,
    step: 'checking',
    txHash: null,
    txStatus: null
  });

  // Tracking if we are initializing
  const [isInitializing, setIsInitializing] = useState(false);

  /**
   * Checks if the player exists and returns status for character selection
   */
  const checkPlayerExists = useCallback(async (): Promise<InitializeResponse> => {
    // Prevent multiple executions
    if (isInitializing) {
      return { success: false, playerExists: false, error: "Already checking" };
    }

    setIsInitializing(true);

    // Validation: Check that the controller is connected
    if (status !== "connected") {
      const error = "Controller not connected. Please connect your controller first.";
      setInitState(prev => ({ ...prev, error }));
      setIsInitializing(false);
      return { success: false, playerExists: false, error };
    }

    // Validation: Check that the account exists
    if (!account) {
      const error = "No account found. Please connect your controller.";
      setInitState(prev => ({ ...prev, error }));
      setIsInitializing(false);
      return { success: false, playerExists: false, error };
    }

    try {
      // Start checking process
      setInitState(prev => ({
        ...prev,
        isInitializing: true,
        error: null,
        step: 'checking'
      }));

      console.log("🎮 Checking if player exists...");

      // Refetch player data
      console.log("🔄 Fetching latest player data...");
      await refetchPlayer();

      // Wait a bit to ensure data is loaded
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Direct check from the store
      const storePlayer = useAppStore.getState().player;

      // Simple check if the player exists in the store
      const playerExists = storePlayer !== null;

      console.log("🎮 Player check result:", {
        playerExists,
        playerInStore: !!storePlayer,
        accountAddress: account.address
      });

      if (playerExists) {
        // Player exists - continue normally
        console.log("✅ Player already exists, continuing with existing data...");

        setInitState(prev => ({
          ...prev,
          step: 'loading'
        }));

        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1000));

        setInitState(prev => ({
          ...prev,
          completed: true,
          isInitializing: false,
          step: 'success'
        }));

        setIsInitializing(false);
        return {
          success: true,
          playerExists: true
        };

      } else {
        // Player does not exist - needs character selection
        console.log("🎯 Player does not exist, needs character selection...");

        setInitState(prev => ({
          ...prev,
          step: 'needs_character_selection',
          completed: false,
          isInitializing: false
        }));

        setIsInitializing(false);
        return {
          success: true,
          playerExists: false,
          needsCharacterSelection: true
        };
      }

    } catch (error: any) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to check player. Please try again.";

      console.error("❌ Error checking player:", error);

      setInitState(prev => ({
        ...prev,
        error: errorMessage,
        isInitializing: false,
        step: 'checking'
      }));

      setIsInitializing(false);
      return { success: false, playerExists: false, error: errorMessage };
    }
  }, [status, account, refetchPlayer, player, isInitializing]);

  /**
   * Spawns a player with a specific character type
   */
  const spawnPlayerWithCharacter = useCallback(async (characterType: string): Promise<InitializeResponse> => {
    // Prevent multiple executions
    if (isInitializing) {
      return { success: false, playerExists: false, error: "Already spawning" };
    }

    setIsInitializing(true);

    // Validation: Check that the controller is connected
    if (status !== "connected") {
      const error = "Controller not connected. Please connect your controller first.";
      setInitState(prev => ({ ...prev, error }));
      setIsInitializing(false);
      return { success: false, playerExists: false, error };
    }

    // Validation: Check that the account exists
    if (!account) {
      const error = "No account found. Please connect your controller.";
      setInitState(prev => ({ ...prev, error }));
      setIsInitializing(false);
      return { success: false, playerExists: false, error };
    }

    const transactionId = uuidv4();

    try {
      console.log(`🆕 Spawning player with character type: ${characterType}...`);

      setInitState(prev => ({
        ...prev,
        isInitializing: true,
        error: null,
        step: 'spawning',
        txStatus: 'PENDING'
      }));

      // Execute spawn transaction
      console.log("📤 Executing spawn transaction...");
      const spawnTx = await client.game.spawnPlayer(account as Account);

      console.log("📥 Spawn transaction response:", spawnTx);

      if (spawnTx?.transaction_hash) {
        setInitState(prev => ({
          ...prev,
          txHash: spawnTx.transaction_hash
        }));
      }

      if (spawnTx && spawnTx.code === "SUCCESS") {
        console.log("🎉 Player spawned successfully!");

        setInitState(prev => ({
          ...prev,
          txStatus: 'SUCCESS'
        }));

        // Wait for the transaction to be processed
        console.log("⏳ Waiting for transaction to be processed...");
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Refetch player data
        console.log("🔄 Refetching player data after spawn...");
        await refetchPlayer();

        setInitState(prev => ({
          ...prev,
          completed: true,
          isInitializing: false,
          step: 'success'
        }));

        // Confirm transaction in the Dojo store
        dojoState.confirmTransaction(transactionId);

        setIsInitializing(false);
        return {
          success: true,
          playerExists: false,
          transactionHash: spawnTx.transaction_hash
        };
      } else {
        // Update transaction state to rejected
        setInitState(prev => ({
          ...prev,
          txStatus: 'REJECTED'
        }));
        throw new Error("Spawn transaction failed with code: " + spawnTx?.code);
      }

    } catch (error: any) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to spawn player. Please try again.";

      console.error("❌ Error spawning player:", error);

      // Revert optimistic update if applicable
      dojoState.revertOptimisticUpdate(transactionId);

      // Update transaction state to rejected if there was a transaction
      if (initState.txHash) {
        setInitState(prev => ({
          ...prev,
          txStatus: 'REJECTED'
        }));
      }

      setInitState(prev => ({
        ...prev,
        error: errorMessage,
        isInitializing: false,
        step: 'checking'
      }));

      setIsInitializing(false);
      return { success: false, playerExists: false, error: errorMessage };
    }
  }, [status, account, refetchPlayer, isInitializing, client.game, dojoState]);

  /**
   * Reset the initialization state
   */
  const resetInitializer = useCallback(() => {
    console.log("🔄 Resetting initializer state...");
    setIsInitializing(false);
    setInitState({
      isInitializing: false,
      error: null,
      completed: false,
      step: 'checking',
      txHash: null,
      txStatus: null
    });
  }, []);

  // Sync loading state with the store
  useEffect(() => {
    setLoading(initState.isInitializing || playerLoading);
  }, [initState.isInitializing, playerLoading, setLoading]);

  return {
    // State
    isInitializing: initState.isInitializing,
    error: initState.error,
    completed: initState.completed,
    currentStep: initState.step,
    txHash: initState.txHash,
    txStatus: initState.txStatus,
    isConnected: status === "connected",
    playerExists: useAppStore.getState().player !== null,
    needsCharacterSelection: initState.step === 'needs_character_selection',

    // Actions
    checkPlayerExists,
    spawnPlayerWithCharacter,
    resetInitializer
  };
};