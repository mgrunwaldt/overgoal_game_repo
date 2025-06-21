import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import useAppStore from "../../zustand/store";
import { Player } from '../../zustand/store';

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
    console.log("🔍 Fetching player with owner:", playerOwner);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PLAYER_QUERY,
        variables: { playerOwner }
      }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.fullStarterReactPlayerModels?.edges?.length) {
      console.log("❌ No player found in response");
      return null;
    }

    // Extract player data
    const rawPlayerData = result.data.fullStarterReactPlayerModels.edges[0].node;
    console.log("📄 Raw player data:", rawPlayerData);

  

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
    };

    console.log("✅ Player data after conversion:", playerData);
    return playerData;

  } catch (error) {
    console.error("❌ Error fetching player:", error);
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
      console.log("set is loading to false - no address");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Starting the fetch")
      console.log("setting loading to true - refetch");
      setIsLoading(true);
      setError(null);

      const playerData = await fetchPlayerData(userAddress);
      console.log("🎮 Player data fetched:", playerData);

      setPlayer(playerData);
      
      const updatedPlayer = useAppStore.getState().player;
      console.log("💾 Player in store after update:", updatedPlayer);
      
      // Small delay to ensure state updates propagate before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setPlayerFetched(true);

      console.log("🎯 player fetched", playerFetched);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error("❌ Error in refetch:", error);
      setError(error);
      setPlayer(null);
    } finally {
      console.log("setting loading to false - finally");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userAddress) {
      console.log("🔄 Address changed, refetching player data");
      refetch();
    } else {
      // If no address, clear player data immediately
      console.log("❌ No address, clearing player data");
      setPlayer(null);
      setError(null);
      console.log("setting loading to useEffect else");
      setIsLoading(false);
    }
  }, [userAddress, setPlayer]);

  useEffect(() => {
    if (!account) {
      console.log("❌ No account, clearing player data");
      setPlayer(null);
      setError(null);
      console.log("setting loading to false - no account");
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