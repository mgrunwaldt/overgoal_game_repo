import { useCallback, useState } from 'react';
import { Account } from 'starknet';
import { useAccount } from '@starknet-react/core';
import { useDojoSDK } from '@dojoengine/sdk/react';
import useAppStore from '../../zustand/store';

export interface UseSelectTeamActionReturn {
  selectTeamState: 'idle' | 'executing' | 'success' | 'error';
  executeSelectTeam: (teamId: number) => Promise<void>;
  canSelectTeam: boolean;
  error: string | null;
}

export const useSelectTeamAction = (): UseSelectTeamActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, updatePlayerSelectedTeam } = useAppStore();
  
  const [selectTeamState, setSelectTeamState] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Check if user can select team
  const isConnected = status === 'connected';
  const hasPlayer = player !== null;
  const canSelectTeam = isConnected && hasPlayer && selectTeamState !== 'executing';

  const executeSelectTeam = useCallback(async (teamId: number) => {
    if (!canSelectTeam || !account || !client) {
      console.error('❌ Cannot select team: missing requirements');
      return;
    }

    try {
      console.log(`🎯 Selecting team ${teamId}...`);
      setSelectTeamState('executing');
      setError(null);

      // Optimistic update
      const previousTeamId = player?.selected_team_id || 0;
      updatePlayerSelectedTeam(teamId);

      // Execute blockchain transaction
      const tx = await client.game.selectTeam(account as Account, teamId);
      console.log('📡 Select team transaction:', tx);

      if (tx && tx.code === "SUCCESS") {
        console.log('✅ Team selection successful');
        setSelectTeamState('success');
        
        // Reset state after a delay
        setTimeout(() => {
          setSelectTeamState('idle');
        }, 2000);
      } else {
        throw new Error(`Transaction failed: ${tx?.code || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error selecting team:', error);
      
      // Rollback optimistic update
      const previousTeamId = player?.selected_team_id || 0;
      updatePlayerSelectedTeam(previousTeamId);
      
      setSelectTeamState('error');
      setError(error instanceof Error ? error.message : 'Failed to select team');
      
      // Reset error state after a delay
      setTimeout(() => {
        setSelectTeamState('idle');
        setError(null);
      }, 3000);
    }
  }, [canSelectTeam, account, client, player, updatePlayerSelectedTeam]);

  return {
    selectTeamState,
    executeSelectTeam,
    canSelectTeam,
    error
  };
}; 