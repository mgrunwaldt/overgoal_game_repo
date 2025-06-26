import React from 'react';
import { useAccount } from '@starknet-react/core';

// Torii URL - should match your setup
const TORII_URL = "http://localhost:8080/graphql";

// Helper to convert hex values to numbers
const hexToNumber = (hexValue: string | number): number => {
  // Handle null/undefined
  if (hexValue === null || hexValue === undefined) {
    console.warn("hexToNumber: received null/undefined, returning 0");
    return 0;
  }

  // If already a number, return it
  if (typeof hexValue === 'number') {
    return isNaN(hexValue) ? 0 : hexValue;
  }

  // Handle string values
  if (typeof hexValue === 'string') {
    // Handle empty string
    if (hexValue === '') {
      console.warn("hexToNumber: received empty string, returning 0");
      return 0;
    }

    // Handle hex strings (0x prefix)
    if (hexValue.startsWith('0x')) {
      const result = parseInt(hexValue, 16);
      return isNaN(result) ? 0 : result;
    }

    // Handle decimal strings
    const result = parseInt(hexValue, 10);
    return isNaN(result) ? 0 : result;
  }

  // Handle boolean (sometimes enums come as boolean)
  if (typeof hexValue === 'boolean') {
    return hexValue ? 1 : 0;
  }

  // Fallback for any other type
  console.warn("hexToNumber: unknown type", typeof hexValue, hexValue);
  return 0;
};

// Function to fetch GameMatch data from GraphQL
export const fetchGameMatch = async (matchId: number): Promise<any | null> => {
  try {
    console.log("🏟️ [FETCH_GAMEMATCH] Fetching GameMatch with ID:", matchId);

    const GAMEMATCH_QUERY = `
      query GetGameMatch($matchId: u32!) {
        fullStarterReactGameMatchModels(where: { match_id: $matchId }) {
          edges {
            node {
              match_id
              my_team_id
              opponent_team_id
              my_team_score
              opponent_team_score
              next_match_action
              next_match_action_minute
              current_time
              prev_time
              match_status
              player_participation
              action_team
            }
          }
        }
      }
    `;

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GAMEMATCH_QUERY,
        variables: { matchId }
      }),
    });

    const result = await response.json();
    console.log("📡 [FETCH_GAMEMATCH] Full GraphQL response:", JSON.stringify(result, null, 2));

    if (!result.data?.fullStarterReactGameMatchModels?.edges?.length) {
      console.log("❌ [FETCH_GAMEMATCH] No GameMatch found in response");
      return null;
    }

    // Extract GameMatch data
    const rawGameMatchData = result.data.fullStarterReactGameMatchModels.edges[0].node;
    console.log("📄 [FETCH_GAMEMATCH] Raw GameMatch data:", JSON.stringify(rawGameMatchData, null, 2));

    // Log each field individually to see what's happening
    console.log("🔍 [FETCH_GAMEMATCH] Individual field analysis:");
    Object.keys(rawGameMatchData).forEach(key => {
      const value = rawGameMatchData[key];
      console.log(`  ${key}: ${value} (type: ${typeof value})`);
    });

    // Helper function to convert enum string names to numbers
    const convertEnumStringToNumber = (value: any, fieldName: string, enumMapping: Record<string, number>): number => {
      console.log(`🔍 [FETCH_GAMEMATCH] Converting enum ${fieldName}:`, value, typeof value);
      
      if (value === null || value === undefined) {
        console.warn(`⚠️ [FETCH_GAMEMATCH] ${fieldName} is null/undefined, defaulting to 0`);
        return 0;
      }
      
      // If it's already a number, return it
      if (typeof value === 'number') {
        console.log(`✅ [FETCH_GAMEMATCH] ${fieldName} is already a number:`, value);
        return value;
      }
      
      // If it's a string, try to map it to enum value
      if (typeof value === 'string') {
        // First try direct enum mapping (e.g., "InProgress" -> 1)
        if (enumMapping[value] !== undefined) {
          const enumValue = enumMapping[value];
          console.log(`✅ [FETCH_GAMEMATCH] ${fieldName} mapped from "${value}" to:`, enumValue);
          return enumValue;
        }
        
        // If that fails, try hex conversion
        const hexResult = hexToNumber(value);
        if (!isNaN(hexResult)) {
          console.log(`✅ [FETCH_GAMEMATCH] ${fieldName} hex converted from "${value}" to:`, hexResult);
          return hexResult;
        }
      }
      
      console.error(`❌ [FETCH_GAMEMATCH] ${fieldName} conversion failed, original value:`, value);
      return 0; // Default fallback
    };

    // Helper function for regular hex conversion
    const safeHexToNumber = (value: any, fieldName: string): number => {
      console.log(`🔍 [FETCH_GAMEMATCH] Converting ${fieldName}:`, value, typeof value);
      
      if (value === null || value === undefined) {
        console.warn(`⚠️ [FETCH_GAMEMATCH] ${fieldName} is null/undefined, defaulting to 0`);
        return 0;
      }
      
      const result = hexToNumber(value);
      console.log(`✅ [FETCH_GAMEMATCH] ${fieldName} converted:`, result);
      
      if (isNaN(result)) {
        console.error(`❌ [FETCH_GAMEMATCH] ${fieldName} conversion resulted in NaN, original value:`, value);
        return 0; // Default fallback
      }
      
      return result;
    };

    // Enum mappings (matching the Cairo enum definitions)
    const matchStatusMapping = {
      "NotStarted": 0,
      "InProgress": 1,
      "HalfTime": 2,
      "Finished": 3
    };

    const matchActionMapping = {
      "OpenPlay": 0,
      "Jumper": 1,
      "Brawl": 2,
      "FreeKick": 3,
      "Penalty": 4,
      "OpenDefense": 5,
      "HalfTime": 6,        // 🆕 FIXED: Added missing HalfTime
      "MatchEnd": 7         // 🆕 FIXED: Added missing MatchEnd
    };

    const playerParticipationMapping = {
      "NotParticipating": 0,
      "Participating": 1,
      "Observing": 2
    };

    const actionTeamMapping = {
      "MyTeam": 0,
      "OpponentTeam": 1,
      "Neutral": 2
    };

    // Convert hex values to numbers with proper enum handling
    const gameMatchData = {
      match_id: safeHexToNumber(rawGameMatchData.match_id, "match_id"),
      my_team_id: safeHexToNumber(rawGameMatchData.my_team_id, "my_team_id"),
      opponent_team_id: safeHexToNumber(rawGameMatchData.opponent_team_id, "opponent_team_id"),
      my_team_score: safeHexToNumber(rawGameMatchData.my_team_score, "my_team_score"),
      opponent_team_score: safeHexToNumber(rawGameMatchData.opponent_team_score, "opponent_team_score"),
      next_match_action: convertEnumStringToNumber(rawGameMatchData.next_match_action, "next_match_action", matchActionMapping),
      next_match_action_minute: safeHexToNumber(rawGameMatchData.next_match_action_minute, "next_match_action_minute"),
      current_time: safeHexToNumber(rawGameMatchData.current_time, "current_time"),
      prev_time: safeHexToNumber(rawGameMatchData.prev_time, "prev_time"),
      match_status: convertEnumStringToNumber(rawGameMatchData.match_status, "match_status", matchStatusMapping),
      player_participation: convertEnumStringToNumber(rawGameMatchData.player_participation, "player_participation", playerParticipationMapping),
      action_team: convertEnumStringToNumber(rawGameMatchData.action_team, "action_team", actionTeamMapping),
    };

    console.log("✅ [FETCH_GAMEMATCH] GameMatch data after conversion:", gameMatchData);
    console.log("🎯 [FETCH_GAMEMATCH] next_match_action_minute:", gameMatchData.next_match_action_minute);
    
    // Validate critical enum fields
    const enumFields = ['match_status', 'next_match_action', 'player_participation', 'action_team'];
    enumFields.forEach(field => {
      const value = gameMatchData[field as keyof typeof gameMatchData];
      if (isNaN(value)) {
        console.error(`❌ [FETCH_GAMEMATCH] CRITICAL: ${field} is NaN after conversion!`);
      } else {
        console.log(`✅ [FETCH_GAMEMATCH] ENUM VALIDATION: ${field} = ${value}`);
      }
    });
    
    return gameMatchData;

  } catch (error) {
    console.error("❌ [FETCH_GAMEMATCH] Error fetching GameMatch:", error);
    throw error;
  }
};

// Function to fetch all GameMatches for debugging
export const fetchAllGameMatches = async (): Promise<any[]> => {
  try {
    console.log("🏟️ [FETCH_ALL_GAMEMATCHES] Fetching all GameMatches");

    const ALL_GAMEMATCHES_QUERY = `
      query GetAllGameMatches {
        fullStarterReactGameMatchModels {
          edges {
            node {
              match_id
              my_team_id
              opponent_team_id
              my_team_score
              opponent_team_score
              next_match_action
              next_match_action_minute
              current_time
              prev_time
              match_status
              player_participation
              action_team
            }
          }
        }
      }
    `;

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: ALL_GAMEMATCHES_QUERY
      }),
    });

    const result = await response.json();
    console.log("📡 [FETCH_ALL_GAMEMATCHES] Full GraphQL response:", JSON.stringify(result, null, 2));

    if (!result.data?.fullStarterReactGameMatchModels?.edges?.length) {
      console.log("❌ [FETCH_ALL_GAMEMATCHES] No GameMatches found");
      return [];
    }

    // Process all GameMatches
    const allMatches = result.data.fullStarterReactGameMatchModels.edges.map((edge: any, index: number) => {
      const rawData = edge.node;
      console.log(`📄 [FETCH_ALL_GAMEMATCHES] GameMatch ${index + 1}:`, JSON.stringify(rawData, null, 2));
      
      // Convert hex values to numbers
      return {
        match_id: hexToNumber(rawData.match_id),
        my_team_id: hexToNumber(rawData.my_team_id),
        opponent_team_id: hexToNumber(rawData.opponent_team_id),
        my_team_score: hexToNumber(rawData.my_team_score),
        opponent_team_score: hexToNumber(rawData.opponent_team_score),
        next_match_action: hexToNumber(rawData.next_match_action),
        next_match_action_minute: hexToNumber(rawData.next_match_action_minute),
        current_time: hexToNumber(rawData.current_time),
        prev_time: hexToNumber(rawData.prev_time),
        match_status: hexToNumber(rawData.match_status),
        player_participation: hexToNumber(rawData.player_participation),
        action_team: hexToNumber(rawData.action_team),
      };
    });

    console.log("✅ [FETCH_ALL_GAMEMATCHES] All GameMatches processed:", allMatches);
    return allMatches;

  } catch (error) {
    console.error("❌ [FETCH_ALL_GAMEMATCHES] Error fetching all GameMatches:", error);
    throw error;
  }
};

// Main hook for GameMatch operations
export const useGameMatch = () => {
  const { account } = useAccount();

  return {
    fetchGameMatch,
    fetchAllGameMatches,
    account
  };
}; 