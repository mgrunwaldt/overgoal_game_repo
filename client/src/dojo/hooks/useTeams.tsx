import { useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import useAppStore from "../../zustand/store";
import type { Team } from "../../zustand/store";
import { dojoConfig } from "../dojoConfig";


// GraphQL query to fetch all teams
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const TEAMS_QUERY = `
    query GetAllTeams {
        fullStarterReactTeamModels (first:14,
        order: { 
          field: "TEAM_ID", 
          direction: "ASC" 
        }
        ) {
            edges {
                node {
                    team_id
                    name
                    offense
                    defense
                    intensity
                    current_league_points
                }
            }
        }
    }
`;

// Helper function to convert hex strings to numbers
const hexToNumber = (hex: string | number): number => {
  if (typeof hex === 'number') return hex;
  if (typeof hex === 'string') {
    // Handle hex strings
    if (hex.startsWith('0x')) {
      return parseInt(hex, 16);
    }
    // Handle regular number strings
    return parseInt(hex, 10) || 0;
  }
  return 0;
};

// Helper function to convert felt252 to string
const feltToString = (felt: string): string => {
  if (!felt || felt === '0x0') return '';
  
  try {
    // Remove 0x prefix if present
    const cleanHex = felt.replace('0x', '');
    
    // Convert hex to string
    let result = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substr(i, 2), 16);
      if (byte !== 0) { // Skip null bytes
        result += String.fromCharCode(byte);
      }
    }
    
    return result.trim();
  } catch (error) {
    console.warn('Failed to convert felt to string:', felt, error);
    return felt; // Return original if conversion fails
  }
};

interface UseTeamsReturn {
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTeams = (): UseTeamsReturn => {
  const { status } = useAccount();
  const { teams, setTeams } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    if (status !== "connected") {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching all teams from GraphQL...");

      const response = await fetch(TORII_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: TEAMS_QUERY,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      }

      console.log("📊 Raw teams data from GraphQL:", result.data);

      const teamsData = result.data?.fullStarterReactTeamModels?.edges || [];
      
      if (teamsData.length === 0) {
        console.log("📝 No teams found in database");
        setTeams([]);
        return;
      }

      const processedTeams: Team[] = teamsData.map((edge: any) => {
        const rawTeam = edge.node;
        
        const processedTeam: Team = {
          team_id: hexToNumber(rawTeam.team_id),
          name: feltToString(rawTeam.name),
          offense: hexToNumber(rawTeam.offense),
          defense: hexToNumber(rawTeam.defense),
          intensity: hexToNumber(rawTeam.intensity),
          current_league_points: hexToNumber(rawTeam.current_league_points),
        };

        console.log(`🏟️ Processed team: ${processedTeam.name} (ID: ${processedTeam.team_id})`);
        return processedTeam;
      });

      console.log(`✅ Successfully fetched ${processedTeams.length} teams`);
      setTeams(processedTeams);

    } catch (error) {
      console.error("❌ Error fetching teams:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch teams');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch teams when wallet connects
  useEffect(() => {
    if (status === "connected") {
      fetchTeams();
    } else {
      setTeams([]); // Clear teams when disconnected
    }
  }, [status]);

  return {
    teams,
    isLoading,
    error,
    refetch: fetchTeams,
  };
}; 