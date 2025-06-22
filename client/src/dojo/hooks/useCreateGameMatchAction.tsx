import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

// Action state type
export type ActionState = 'idle' | 'executing' | 'success' | 'error';

export interface UseCreateGameMatchActionReturn {
    createGameMatchState: ActionState;
    executeCreateGameMatch: (matchId: number, myTeamId: number, opponentTeamId: number) => Promise<void>;
    canCreateGameMatch: boolean;
    isLoading: boolean;
    error: string | null;
}

export const useCreateGameMatchAction = (): UseCreateGameMatchActionReturn => {
    const { account, status } = useAccount();
    const { client } = useDojoSDK();
    const { addGameMatch } = useAppStore();
    
    // Local state
    const [createGameMatchState, setCreateGameMatchState] = useState<ActionState>('idle');
    const [error, setError] = useState<string | null>(null);

    // Computed states
    const isConnected = status === 'connected';
    const isLoading = createGameMatchState === 'executing';
    const canCreateGameMatch = isConnected && !isLoading;

    const executeCreateGameMatch = useCallback(async (
        matchId: number, 
        myTeamId: number, 
        opponentTeamId: number
    ) => {
        if (!canCreateGameMatch) {
            setError("Cannot create game match: wallet not connected or action in progress");
            return;
        }

        // Validation
        if (matchId <= 0) {
            setError("Match ID must be greater than 0");
            return;
        }

        if (myTeamId <= 0) {
            setError("My team ID must be greater than 0");
            return;
        }

        if (opponentTeamId <= 0) {
            setError("Opponent team ID must be greater than 0");
            return;
        }

        if (myTeamId === opponentTeamId) {
            setError("My team and opponent team cannot be the same");
            return;
        }

        setCreateGameMatchState('executing');
        setError(null);

        try {
            console.log(`🎮 Creating game match: ${matchId}`);
            console.log(`⚽ Teams - My Team: ${myTeamId}, Opponent: ${opponentTeamId}`);

            // Optimistic update - add the new match to local state
            const newGameMatch = {
                match_id: matchId,
                my_team_id: myTeamId,
                opponent_team_id: opponentTeamId,
                my_team_score: 0,
                opponent_team_score: 0,
                next_match_action: 0, // OpenPlay
                next_match_action_minute: 1,
                current_time: 0,
                match_status: 0, // NotStarted
            };

            addGameMatch(newGameMatch);

            // Execute blockchain transaction
            const tx = await client.game.createGamematch(
                account as Account,
                matchId,
                myTeamId,
                opponentTeamId
            );

            console.log("📋 Create game match transaction response:", tx);

            if (tx && tx.code === "SUCCESS") {
                console.log("✅ Game match created successfully!");
                setCreateGameMatchState('success');
                
                // Reset to idle after success
                setTimeout(() => {
                    setCreateGameMatchState('idle');
                }, 2000);
            } else {
                throw new Error(`Transaction failed: ${tx?.code || 'Unknown error'}`);
            }

        } catch (error: any) {
            console.error("❌ Create game match error:", error);
            
            setCreateGameMatchState('error');
            setError(error instanceof Error ? error.message : 'Failed to create game match');
            
            // Reset to idle after error
            setTimeout(() => {
                setCreateGameMatchState('idle');
                setError(null);
            }, 3000);
        }
    }, [account, client, canCreateGameMatch, addGameMatch]);

    return {
        createGameMatchState,
        executeCreateGameMatch,
        canCreateGameMatch,
        isLoading,
        error,
    };
}; 