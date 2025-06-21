import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

// Action state type
export type ActionState = 'idle' | 'executing' | 'success' | 'error';

export interface UseCreateTeamActionReturn {
  createTeamState: ActionState;
  executeCreateTeam: (teamId: number, name: string, offense: number, defense: number, intensity: number) => Promise<void>;
  canCreateTeam: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useCreateTeamAction = (): UseCreateTeamActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { addTeam } = useAppStore();
  
  // Local state
  const [createTeamState, setCreateTeamState] = useState<ActionState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Computed states
  const isConnected = status === "connected";
  const isLoading = createTeamState === 'executing';
  const canCreateTeam = isConnected && !isLoading;

  const executeCreateTeam = useCallback(async (
    teamId: number, 
    name: string, 
    offense: number, 
    defense: number, 
    intensity: number
  ) => {
    if (!canCreateTeam) {
      setError("Cannot create team: wallet not connected or action in progress");
      return;
    }

    // Validation
    if (teamId <= 0) {
      setError("Team ID must be greater than 0");
      return;
    }

    if (!name || name.trim().length === 0) {
      setError("Team name is required");
      return;
    }

    if (offense < 0 || offense > 100) {
      setError("Offense must be between 0-100");
      return;
    }

    if (defense < 0 || defense > 100) {
      setError("Defense must be between 0-100");
      return;
    }

    if (intensity < 0 || intensity > 100) {
      setError("Intensity must be between 0-100");
      return;
    }

    setCreateTeamState('executing');
    setError(null);

    try {
      console.log(`🏟️ Creating team: ${name} (ID: ${teamId})`);
      console.log(`📊 Stats - Offense: ${offense}, Defense: ${defense}, Intensity: ${intensity}`);

      // Optimistic update - add team to local state immediately
      const newTeam = {
        team_id: teamId,
        name: name,
        offense: offense,
        defense: defense,
        intensity: intensity,
        current_league_points: 0, // Always starts at 0
      };

      addTeam(newTeam);

      // Execute blockchain transaction
      const tx = await client.game.createTeam(
        account as Account,
        teamId,
        name,
        offense,
        defense,
        intensity
      );

      console.log("📋 Create team transaction response:", tx);

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Team created successfully!");
        setCreateTeamState('success');
        
        // Reset to idle after success
        setTimeout(() => {
          setCreateTeamState('idle');
        }, 2000);
      } else {
        throw new Error(`Transaction failed: ${tx?.code || 'Unknown error'}`);
      }

    } catch (error) {
      console.error("❌ Create team error:", error);
      
      // Rollback optimistic update by removing the team
      // Note: In a more sophisticated implementation, you might want to 
      // track the optimistic updates to properly rollback
      
      setCreateTeamState('error');
      setError(error instanceof Error ? error.message : 'Failed to create team');
      
      // Reset to idle after error
      setTimeout(() => {
        setCreateTeamState('idle');
        setError(null);
      }, 3000);
    }
  }, [account, client, canCreateTeam, addTeam]);

  return {
    createTeamState,
    executeCreateTeam,
    canCreateTeam,
    isLoading,
    error,
  };
}; 