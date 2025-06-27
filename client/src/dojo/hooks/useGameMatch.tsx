import { useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { GAME_MATCH_QUERY, MATCH_TIMELINE_EVENTS_QUERY } from "./queries";
import { 
  GameMatch, 
  MatchTimelineEvent, 
  matchActionMapping, 
  matchStatusMapping, 
  playerParticipationMapping, 
  actionTeamMapping 
} from "./types";
import { dojoConfig } from "../dojoConfig";
import useAppStore from "../../zustand/store";
import { hexToNumber, hexToString } from "../../utils/utils";

const TORII_URL = dojoConfig.toriiUrl + "/graphql";

const safeHexToNumber = (hex: string | number | undefined, fieldName: string): number => {
    if (hex === undefined || hex === null) {
        return 0;
    }
    if (typeof hex === 'number') {
        return hex;
    }
    try {
        return parseInt(hex, 16);
    } catch (error) {
        console.error(`Error converting hex "${hex}" for field "${fieldName}":`, error);
        return 0;
    }
};

const convertEnumStringToNumber = (enumString: string, fieldName: string, mapping: { [key: string]: number }): number => {
    if (typeof enumString !== 'string') {
        return 0;
    }
    const upperCaseEnumString = enumString.toUpperCase();
    const value = mapping[upperCaseEnumString];
    if (value === undefined) {
        return 0;
    }
    return value;
};

export const fetchGameMatch = async (matchId: number) => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GAME_MATCH_QUERY,
        variables: { matchId },
      }),
    });
    const matchResult = await response.json();

    const timelineResponse = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: MATCH_TIMELINE_EVENTS_QUERY,
        variables: { matchId },
      }),
    });
    const timelineResult = await timelineResponse.json();

    console.log("Timeline Events RAW:", JSON.stringify(timelineResult, null, 2));

    if (!matchResult.data?.fullStarterReactGameMatchModels?.edges?.length) {
        return null;
    }

    const rawGameMatch = matchResult.data.fullStarterReactGameMatchModels.edges[0].node;

    const gameMatchData: GameMatch = {
      match_id: safeHexToNumber(rawGameMatch.match_id, "match_id"),
      my_team_id: safeHexToNumber(rawGameMatch.my_team_id, "my_team_id"),
      opponent_team_id: safeHexToNumber(rawGameMatch.opponent_team_id, "opponent_team_id"),
      my_team_score: safeHexToNumber(rawGameMatch.my_team_score, "my_team_score"),
      opponent_team_score: safeHexToNumber(rawGameMatch.opponent_team_score, "opponent_team_score"),
      next_match_action: convertEnumStringToNumber(rawGameMatch.next_match_action, "next_match_action", matchActionMapping),
      next_match_action_minute: safeHexToNumber(rawGameMatch.next_match_action_minute, "next_match_action_minute"),
      current_time: safeHexToNumber(rawGameMatch.current_time, "current_time"),
      prev_time: safeHexToNumber(rawGameMatch.prev_time, "prev_time"),
      match_status: convertEnumStringToNumber(rawGameMatch.match_status, "match_status", matchStatusMapping),
      player_participation: convertEnumStringToNumber(rawGameMatch.player_participation, "player_participation", playerParticipationMapping),
      action_team: convertEnumStringToNumber(rawGameMatch.action_team, "action_team", actionTeamMapping),
      event_counter: hexToNumber(rawGameMatch.event_counter),
    };

    let timelineEventsData: MatchTimelineEvent[] = [];
    if (timelineResult.data?.fullStarterReactMatchTimelineEventModels?.edges?.length > 0) {
      timelineEventsData = timelineResult.data.fullStarterReactMatchTimelineEventModels.edges.map(
        (edge: any) => {
          const node = edge.node;
          return {
            match_id: hexToNumber(node.match_id),
            event_id: hexToNumber(node.event_id),
            action: convertEnumStringToNumber(node.action, "action", matchActionMapping),
            minute: hexToNumber(node.minute),
            team: convertEnumStringToNumber(node.team, "team", actionTeamMapping),
            description: hexToString(node.description),
          };
        }
      );
      
      // Sort events by event_id to ensure chronological order
      timelineEventsData.sort((a, b) => a.event_id - b.event_id);
    }
    
    return { gameMatchData, timelineEventsData };
  } catch (error) {
    console.error("Error fetching game match data:", error);
    throw error;
  }
};

export function useGameMatch(matchId: number) {
  const { account } = useAccount();
  const { client } = useDojoSDK();
  const { setCurrentMatch, setMatchTimelineEvents } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getGameMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGameMatch(matchId);
      if (result) {
        setCurrentMatch(result.gameMatchData);
        setMatchTimelineEvents(result.timelineEventsData);
      }
    } catch (err) {
        if (err instanceof Error) {
            setError(err);
        } else {
            setError(new Error('An unknown error occurred'));
        }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId > 0) {
      getGameMatch();
    }
  }, [matchId]);

  const handleStartGameMatch = async (teamId: number) => {
    if (!account) return;
    setLoading(true);
    try {
      await client.game.start_gamematch(account, teamId);
      await getGameMatch(); 
    } catch (err) {
        if (err instanceof Error) {
            setError(err);
        } else {
            setError(new Error('An unknown error occurred'));
        }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessMatchAction = async (decision: number) => {
    if (!account) return;
    setLoading(true);
    try {
      await client.game.process_match_action(account, matchId, decision);
      await getGameMatch();
    } catch (err) {
        if (err instanceof Error) {
            setError(err);
        } else {
            setError(new Error('An unknown error occurred'));
        }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGameMatch = async () => {
    if (!account) return;
    setLoading(true);
    try {
      await client.game.simulate_gamematch(account, matchId);
      await getGameMatch();
    } catch (err) {
        if (err instanceof Error) {
            setError(err);
        } else {
            setError(new Error('An unknown error occurred'));
        }
    } finally {
      setLoading(false);
    }
  };

  return {
    getGameMatch,
    handleStartGameMatch,
    handleProcessMatchAction,
    handleSimulateGameMatch,
    loading,
    error,
  };
} 