import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

export interface UseCreateGameMatchActionReturn {
    createGameMatchState: 'idle' | 'loading' | 'success' | 'error';
    executeCreateGameMatch: (matchId: number, myTeamId: number, opponentTeamId: number) => Promise<void>;
    canCreateGameMatch: boolean;
    error: string | null;
}

export const useCreateGameMatchAction = (): UseCreateGameMatchActionReturn => {
    const { account, status } = useAccount();
    const { client } = useDojoSDK();
    const { player, addGameMatch, setError } = useAppStore();
    
    const [createGameMatchState, setCreateGameMatchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setLocalError] = useState<string | null>(null);

    const isConnected = status === 'connected';
    const hasPlayer = !!player;
    const canCreateGameMatch = isConnected && hasPlayer && createGameMatchState !== 'loading';

    const executeCreateGameMatch = useCallback(async (matchId: number, myTeamId: number, opponentTeamId: number) => {
        if (!canCreateGameMatch || !account) {
            return;
        }

        setCreateGameMatchState('loading');
        setLocalError(null);
        setError(null);

        try {
            // Validation
            if (matchId <= 0) {
                throw new Error('Match ID must be greater than 0');
            }
            if (myTeamId <= 0) {
                throw new Error('My team ID must be greater than 0');
            }
            if (opponentTeamId <= 0) {
                throw new Error('Opponent team ID must be greater than 0');
            }
            if (myTeamId === opponentTeamId) {
                throw new Error('My team and opponent team cannot be the same');
            }

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
            const tx = await client.game.createGamematch(account as Account, matchId, myTeamId, opponentTeamId);

            if (tx && tx.code === "SUCCESS") {
                setCreateGameMatchState('success');
                console.log('✅ GameMatch created successfully:', { matchId, myTeamId, opponentTeamId });
                
                // Reset state after a delay
                setTimeout(() => {
                    setCreateGameMatchState('idle');
                }, 2000);
            } else {
                throw new Error(`Transaction failed: ${tx?.code || 'Unknown error'}`);
            }

        } catch (error: any) {
            console.error('❌ Error creating GameMatch:', error);
            
            const errorMessage = error?.message || 'Failed to create GameMatch';
            setLocalError(errorMessage);
            setError(errorMessage);
            setCreateGameMatchState('error');

            // Rollback optimistic update by removing the match
            // Note: In a more sophisticated implementation, we'd have a proper rollback mechanism
            
            // Reset error state after a delay
            setTimeout(() => {
                setCreateGameMatchState('idle');
                setLocalError(null);
            }, 3000);
        }
    }, [account, client, canCreateGameMatch, addGameMatch, setError]);

    return {
        createGameMatchState,
        executeCreateGameMatch,
        canCreateGameMatch,
        error,
    };
}; 