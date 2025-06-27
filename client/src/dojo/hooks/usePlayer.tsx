import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import useAppStore from "../../zustand/store";
import { Player, PlayerType } from '../../zustand/store';

interface UsePlayerReturn {
  player: Player | null;
  isLoading: boolean;
  playerFetched:boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const PLAYER_QUERY = `
    query GetPlayer($playerOwner: ContractAddress!) {
        fullStarterReactPlayerModels(where: { owner: $playerOwner }) {
            edges {
                node {
                    owner
                    experience
                    health
                    coins
                    creation_day
                    shoot
                    dribble
                    energy
                    stamina
                    charisma
                    fame
                    selected_team_id
                    is_player_created
                    is_injured
                    passing
                    free_kick
                    team_relationship
                    intelligence
                    player_type
                }
            }
        }
    }
`;

// Add GraphQL query for PlayerEventHistory
const PLAYER_EVENT_HISTORY_QUERY = `
    query GetPlayerEventHistory($playerOwner: ContractAddress!) {
        fullStarterReactPlayerEventHistoryModels(where: { player: $playerOwner }) {
            edges {
                node {
                    player
                    last_event_id
                    last_outcome_id
                    last_execution_timestamp
                }
            }
        }
    }
`;

// Helper to convert hex values to numbers
const hexToNumber = (hexValue: string | number): number => {
  if (typeof hexValue === 'number') return hexValue;

  if (typeof hexValue === 'string' && hexValue.startsWith('0x')) {
    return parseInt(hexValue, 16);
  }

  if (typeof hexValue === 'string') {
    return parseInt(hexValue, 10);
  }

  return 0;
};

// Function to fetch player data from GraphQL
const fetchPlayerData = async (playerOwner: string): Promise<Player | null> => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PLAYER_QUERY,
        variables: { playerOwner }
      }),
    });

    const result = await response.json();

    if (!result.data?.fullStarterReactPlayerModels?.edges?.length) {
      return null;
    }

    // Extract player data
    const rawPlayerData = result.data.fullStarterReactPlayerModels.edges[0].node;

    // Convert hex values to numbers - including new fields
    const playerData: Player = {
      owner: rawPlayerData.owner,
      experience: hexToNumber(rawPlayerData.experience),
      health: hexToNumber(rawPlayerData.health),
      coins: hexToNumber(rawPlayerData.coins),
      creation_day: hexToNumber(rawPlayerData.creation_day),
      shoot: hexToNumber(rawPlayerData.shoot ),
      dribble: hexToNumber(rawPlayerData.dribble ),
      energy: hexToNumber(rawPlayerData.energy ),
      stamina: hexToNumber(rawPlayerData.stamina ),
      charisma: hexToNumber(rawPlayerData.charisma ),
      fame: hexToNumber(rawPlayerData.fame ),
      selected_team_id: hexToNumber(rawPlayerData.selected_team_id || 0),
      is_player_created: Boolean(rawPlayerData.is_player_created),
      // ✅ ADD NEW FIELDS WITH DEFAULTS
      is_injured: Boolean(rawPlayerData.is_injured || false),
      passing: hexToNumber(rawPlayerData.passing || 0),
      free_kick: hexToNumber(rawPlayerData.free_kick || 0),
      team_relationship: hexToNumber(rawPlayerData.team_relationship || 0),
      intelligence: hexToNumber(rawPlayerData.intelligence || 0),
      player_type: (rawPlayerData.player_type !== undefined ? rawPlayerData.player_type : PlayerType.Striker) as PlayerType,
    };

    return playerData;

  } catch (error) {
    throw error;
  }
};

// ✅ ADD: Function to fetch PlayerEventHistory data from GraphQL
export const fetchPlayerEventHistory = async (playerOwner: string): Promise<{ last_event_id: number; last_outcome_id: number; last_execution_timestamp: number } | null> => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PLAYER_EVENT_HISTORY_QUERY,
        variables: { playerOwner }
      }),
    });

    const result = await response.json();

    if (!result.data?.fullStarterReactPlayerEventHistoryModels?.edges?.length) {
      return null;
    }

    // Extract player event history data
    const rawHistoryData = result.data.fullStarterReactPlayerEventHistoryModels.edges[0].node;

    // Convert hex values to numbers
    const historyData = {
      last_event_id: hexToNumber(rawHistoryData.last_event_id),
      last_outcome_id: hexToNumber(rawHistoryData.last_outcome_id),
      last_execution_timestamp: hexToNumber(rawHistoryData.last_execution_timestamp),
    };

    return historyData;

  } catch (error) {
    throw error;
  }
};

// Main hook
export const usePlayer = (): UsePlayerReturn => {
  const [playerFetched, setPlayerFetched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storePlayer = useAppStore(state => state.player);
  const setPlayer = useAppStore(state => state.setPlayer);

  const userAddress = useMemo(() =>
    account ? addAddressPadding(account.address).toLowerCase() : '',
    [account]
  );

  const refetch = async () => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const playerData = await fetchPlayerData(userAddress);

      setPlayer(playerData);
      
      // Small delay to ensure state updates propagate before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setPlayerFetched(true);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userAddress) {
      refetch();
    } else {
      // If no address, clear player data immediately
      setPlayer(null);
      setError(null);
      setIsLoading(false);
    }
  }, [userAddress, setPlayer]);

  useEffect(() => {
    if (!account) {
      setPlayer(null);
      setError(null);
      setIsLoading(false);
    }
  }, [account, setPlayer]);

  return {
    player: storePlayer,
    isLoading,
    playerFetched,
    error,
    refetch
  };
};