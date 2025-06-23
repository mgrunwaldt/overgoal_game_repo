import { useEffect, useState, useMemo } from "react";
import { dojoConfig } from "../dojoConfig";

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";

// GraphQL queries
const NON_MATCH_EVENTS_QUERY = `
  query GetNonMatchEvents {
    fullStarterReactNonMatchEventModels(first: 100) {
      edges {
        node {
          event_id
          name
          description
          is_available
        }
      }
    }
  }
`;

const NON_MATCH_EVENT_OUTCOMES_QUERY = `
  query GetNonMatchEventOutcomes($event_id: u32!) {
    fullStarterReactNonMatchEventOutcomeModels(where: { event_id: $event_id }) {
      edges {
        node {
          event_id
          outcome_id
          outcome_type
          name
          description
          coins_delta
          shoot_delta
          dribble_delta
          energy_delta
          stamina_delta
          charisma_delta
          fame_delta
          passing_delta
          free_kick_delta
          team_relationship_delta
          intelligence_delta
          sets_injured
        }
      }
    }
  }
`;

const PLAYER_EVENT_HISTORY_QUERY = `
  query GetPlayerEventHistory($player: ContractAddress!) {
    fullStarterReactPlayerEventHistoryModels(where: { player: $player }) {
      edges {
        node {
          player
          event_id
          times_triggered
          last_outcome_id
          last_triggered_day
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

// Helper to convert hex strings to readable text
const hexToString = (hexValue: string): string => {
  if (!hexValue || typeof hexValue !== 'string') return '';
  
  // Remove 0x prefix if present
  const cleanHex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
  
  // If it's not a hex string, return as is
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) return hexValue;
  
  try {
    // Convert hex to bytes and then to string
    let result = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const hexPair = cleanHex.substr(i, 2);
      const charCode = parseInt(hexPair, 16);
      if (charCode !== 0) { // Skip null bytes
        result += String.fromCharCode(charCode);
      }
    }
    return result || hexValue; // Return original if conversion fails
  } catch (error) {
    console.warn('Failed to convert hex to string:', hexValue, error);
    return hexValue; // Return original hex if conversion fails
  }
};

// Helper function to shuffle an array and get the first N items
//todo: this should be defined in the backend, with this implementation anywone with access to the client can choose the nme they want

function getRandomItemsFromArray<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Interfaces
export interface NonMatchEvent {
  event_id: number;
  name: string;
  description: string;
  is_available: boolean;
}

export interface NonMatchEventOutcome {
  event_id: number;
  outcome_id: number;
  outcome_type: number;
  name: string;
  description: string;
  coins_delta: number;
  shoot_delta: number;
  dribble_delta: number;
  energy_delta: number;
  stamina_delta: number;
  charisma_delta: number;
  fame_delta: number;
  passing_delta: number;
  free_kick_delta: number;
  team_relationship_delta: number;
  intelligence_delta: number;
  sets_injured: boolean;
}

export interface PlayerEventHistory {
  player: string;
  event_id: number;
  times_triggered: number;
  last_outcome_id: number;
  last_triggered_day: number;
}

// Fetch functions
const fetchNonMatchEvents = async (): Promise<NonMatchEvent[]> => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: NON_MATCH_EVENTS_QUERY,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error("Failed to fetch non-match events due to GraphQL errors.");
    }

    if (!result.data?.fullStarterReactNonMatchEventModels?.edges?.length) {
      console.log("No non-match events returned from GraphQL.");
      return [];
    }

    const allEvents: NonMatchEvent[] = result.data.fullStarterReactNonMatchEventModels.edges
      .map((edge: any) => edge?.node)
      .filter(Boolean)
      .map((event: any) => ({
        event_id: hexToNumber(event.event_id),
        name: hexToString(event.name) || "",
        description: hexToString(event.description) || "",
        is_available: Boolean(event.is_available),
      }));

    console.log("Fetched all non-match events:", allEvents);

    const randomEvents = getRandomItemsFromArray(allEvents, 4);

    console.log("Randomly selected 4 events:", randomEvents);
    
    return randomEvents;

  } catch (error) {
    console.error("❌ Error fetching non-match events:", error);
    throw error;
  }
};

const fetchNonMatchEventOutcomes = async (eventId: number): Promise<NonMatchEventOutcome[]> => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: NON_MATCH_EVENT_OUTCOMES_QUERY,
        variables: { event_id: eventId },
      }),
    });

    const result = await response.json();
    
    if (!result.data?.fullStarterReactNonMatchEventOutcomeModels?.edges?.length) {
      return [];
    }

    return result.data.fullStarterReactNonMatchEventOutcomeModels.edges
      .map((edge: any) => edge?.node)
      .filter(Boolean)
      .map((outcome: any) => ({
        event_id: hexToNumber(outcome.event_id),
        outcome_id: hexToNumber(outcome.outcome_id),
        outcome_type: hexToNumber(outcome.outcome_type),
        name: hexToString(outcome.name) || "",
        description: hexToString(outcome.description) || "",
        coins_delta: hexToNumber(outcome.coins_delta),
        shoot_delta: hexToNumber(outcome.shoot_delta),
        dribble_delta: hexToNumber(outcome.dribble_delta),
        energy_delta: hexToNumber(outcome.energy_delta),
        stamina_delta: hexToNumber(outcome.stamina_delta),
        charisma_delta: hexToNumber(outcome.charisma_delta),
        fame_delta: hexToNumber(outcome.fame_delta),
        passing_delta: hexToNumber(outcome.passing_delta),
        free_kick_delta: hexToNumber(outcome.free_kick_delta),
        team_relationship_delta: hexToNumber(outcome.team_relationship_delta),
        intelligence_delta: hexToNumber(outcome.intelligence_delta),
        sets_injured: Boolean(outcome.sets_injured),
      }));
  } catch (error) {
    console.error("❌ Error fetching non-match event outcomes:", error);
    throw error;
  }
};

const fetchPlayerEventHistory = async (playerAddress: string): Promise<PlayerEventHistory[]> => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PLAYER_EVENT_HISTORY_QUERY,
        variables: { player: playerAddress },
      }),
    });

    const result = await response.json();
    
    if (!result.data?.fullStarterReactPlayerEventHistoryModels?.edges?.length) {
      return [];
    }

    return result.data.fullStarterReactPlayerEventHistoryModels.edges
      .map((edge: any) => edge?.node)
      .filter(Boolean)
      .map((history: any) => ({
        player: history.player || "",
        event_id: hexToNumber(history.event_id),
        times_triggered: hexToNumber(history.times_triggered),
        last_outcome_id: hexToNumber(history.last_outcome_id),
        last_triggered_day: hexToNumber(history.last_triggered_day),
      }));
  } catch (error) {
    console.error("❌ Error fetching player event history:", error);
    throw error;
  }
};

// Hooks
export function useNonMatchEvents() {
  const [nonMatchEvents, setNonMatchEvents] = useState<NonMatchEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await fetchNonMatchEvents();
      setNonMatchEvents(events);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    nonMatchEvents,
    loading,
    error,
    refetch,
  };
}

export function useNonMatchEventOutcomes(eventId: number) {
  const [outcomes, setOutcomes] = useState<NonMatchEventOutcome[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!eventId) {
      setOutcomes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const eventOutcomes = await fetchNonMatchEventOutcomes(eventId);
      setOutcomes(eventOutcomes);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [eventId]);

  return {
    outcomes,
    loading,
    error,
    refetch,
  };
}

export function usePlayerEventHistory(playerAddress: string) {
  const [eventHistory, setEventHistory] = useState<PlayerEventHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!playerAddress) {
      setEventHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const history = await fetchPlayerEventHistory(playerAddress);
      setEventHistory(history);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [playerAddress]);

  return {
    eventHistory,
    loading,
    error,
    refetch,
  };
} 