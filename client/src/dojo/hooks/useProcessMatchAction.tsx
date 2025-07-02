import React, { useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import useAppStore from "../../zustand/store";
import { fetchGameMatch } from './useGameMatch';
import { MatchTimelineEvent } from './types';

export type UseProcessMatchActionReturn = {
  execute: (matchId: number, decision: number) => Promise<void>;
  choseAction: (matchId: number, decision: number, actionMinute: number) => Promise<{ allTimelineEvents: MatchTimelineEvent[], resultText: string } | null>;
  state: 'idle' | 'executing' | 'success' | 'error';
  error: string | null;
};

export const useProcessMatchAction = (): UseProcessMatchActionReturn => {
  const { account } = useAccount();
  const { client } = useDojoSDK();
  const { updateGameMatch, setCurrentMatch, gameMatches } = useAppStore();

  const [state, setState] = React.useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

const choseAction = useCallback(async (matchId: number, decision: number, actionMinute: number): Promise<{ allTimelineEvents: MatchTimelineEvent[], resultText: string } | null> => {
  console.log("⚽ [PROCESS_ACTION] Processing match decision", {
    matchId,
    decision,
    actionMinute,
    hasAccount: !!account,
    hasClient: !!client,
    accountAddress: account?.address
  });

  if (!account || !client) {
    const errorMsg = "No account connected";
    console.error("❌ [PROCESS_ACTION] Failed:", errorMsg);
    setError(errorMsg);
    setState('error');
    return null;
  }

  try {
    setState('executing');
    setError(null);

    // Get current timeline events from store for merging
    const currentTimelineEvents = gameMatches[matchId]?.timelineEvents || [];

    // 1️⃣ EXECUTE CONTRACT TRANSACTION
    const tx = await client!.game.processMatchAction(account, matchId, decision);
    

    if (tx && tx.code === "SUCCESS") {
      console.log("✅ [PROCESS_ACTION] Transaction successful");
      setState('success');

      // 2️⃣ WAIT FOR INDEXING
      console.log("⏳ [PROCESS_ACTION] Waiting for indexing (2s)...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3️⃣ FETCH ALL TIMELINE EVENTS FROM BACKEND
      console.log("🔄 [PROCESS_ACTION] Fetching ALL timeline events from backend...");
      try {
        const result = await fetchGameMatch(matchId);
        console.log("📊 [PROCESS_ACTION] Backend result fetched:", result);
        
        if (result && result.gameMatchData && result.timelineEventsData) {
          const allBackendEvents = result.timelineEventsData;
          
          // 4️⃣ UPDATE STORE WITH REAL DATA
          console.log("🔄 [PROCESS_ACTION] Updating store with real data");
          updateGameMatch(matchId, result.gameMatchData);
          setCurrentMatch(result.gameMatchData);

          // 5️⃣ MERGE TIMELINE EVENTS (AVOID DUPLICATES)
          const mergedEvents: MatchTimelineEvent[] = [...currentTimelineEvents];
          allBackendEvents.forEach((backendEvent: MatchTimelineEvent) => {
            const exists = mergedEvents.some((existing: MatchTimelineEvent) => existing.event_id === backendEvent.event_id);
            if (!exists) {
              mergedEvents.push(backendEvent);
            }
          });
          
          // Sort by event_id ONLY for consistency
          mergedEvents.sort((a, b) => a.event_id - b.event_id);

          console.log("📊 [PROCESS_ACTION] All timeline events (sorted):", mergedEvents.length);

          // 6️⃣ CREATE RESULT TEXT FROM EVENT WITH HIGHEST EVENT_ID
          let resultText = "Action completed!";
          const latestEvents = allBackendEvents.filter((evt: MatchTimelineEvent) => 
            !currentTimelineEvents.some((existing: MatchTimelineEvent) => existing.event_id === evt.event_id)
          );
          if (latestEvents.length > 0) {
            // 🎯 HELPER: Decode hex description to readable text
            const decodeDescription = (hexDescription: string): string => {
              if (hexDescription.startsWith('0x')) {
                try {
                  const hex = hexDescription.slice(2);
                  const bytes = [];
                  for (let i = 0; i < hex.length; i += 2) {
                    bytes.push(parseInt(hex.substr(i, 2), 16));
                  }
                  return String.fromCharCode(...bytes);
                } catch (error) {
                  console.warn("Failed to decode hex description:", hexDescription);
                  return hexDescription;
                }
              }
              return hexDescription;
            };

            // 🎯 STEP 1: Filter by minute FIRST, then by player_participates: false
            if (latestEvents.length === 0) {
              console.warn("No latest events found");
              return { allTimelineEvents: mergedEvents, resultText: "Action completed!" };
            }
            
            console.log("🎯 All new events:", latestEvents.map(e => ({
              event_id: e.event_id,
              minute: e.minute,
              description: e.description,
              player_participates: e.player_participates
            })));
            console.log("🎯 Action minute:", actionMinute);
            
            // STEP 1: Filter by the specific action minute
            const eventsInActionMinute = latestEvents.filter(evt => evt.minute === actionMinute);
            console.log("🎯 Events in action minute", actionMinute, ":", eventsInActionMinute.map(e => ({
              event_id: e.event_id,
              description: e.description,
              player_participates: e.player_participates
            })));
            
            // STEP 2: From that minute, find result events (player_participates: false)
            const resultEventsInMinute = eventsInActionMinute.filter(evt => !evt.player_participates);
            console.log("🎯 Result events in minute", actionMinute, ":", resultEventsInMinute.map(e => ({
              event_id: e.event_id,
              description: e.description
            })));
            
            let resultEvent: MatchTimelineEvent;
            if (resultEventsInMinute.length > 0) {
              // STEP 3: Take the result event with highest event_id in that minute
              resultEvent = resultEventsInMinute.reduce((prev, current) => 
                current.event_id > prev.event_id ? current : prev
              );
              console.log("🎯 Selected result event (minute-filtered, highest event_id):", {
                event_id: resultEvent.event_id,
                minute: resultEvent.minute,
                description: resultEvent.description
              });
            } else {
              // Fallback: if no result events in that minute, take highest event_id in that minute
              if (eventsInActionMinute.length > 0) {
                resultEvent = eventsInActionMinute.reduce((prev, current) => 
                  current.event_id > prev.event_id ? current : prev
                );
                console.log("🎯 No result events in minute, using highest event_id in minute as fallback:", {
                  event_id: resultEvent.event_id,
                  minute: resultEvent.minute,
                  description: resultEvent.description
                });
              } else {
                // Last resort: take highest event_id overall
                resultEvent = latestEvents.reduce((prev, current) => 
                  current.event_id > prev.event_id ? current : prev
                );
                console.log("🎯 No events in action minute, using global highest event_id as fallback:", {
                  event_id: resultEvent.event_id,
                  minute: resultEvent.minute,
                  description: resultEvent.description
                });
              }
            }
            
            console.log("🎯 Selected result event (highest event_id among results):", {
              event_id: resultEvent.event_id,
              minute: resultEvent.minute,
              description: resultEvent.description,
              team_scored: resultEvent.team_scored,
              opponent_team_scored: resultEvent.opponent_team_scored,
              player_participates: resultEvent.player_participates
            });
            
            // 🎯 STEP 2: Always show the decoded description from the result event
            const decodedDescription = decodeDescription(resultEvent.description || 'Match event');
            resultText = decodedDescription;
          }

          // Reset state after processing
          setTimeout(() => {
            setState('idle');
          }, 1000);

          return {
            allTimelineEvents: mergedEvents,
            resultText: resultText
          };
        } else {
          console.warn("⚠️ [PROCESS_ACTION] No backend data found");
          return null;
        }
      } catch (fetchError) {
        console.error("❌ [PROCESS_ACTION] Failed to fetch backend data:", fetchError);
        return null;
      }

    } else {
      throw new Error(`Transaction failed: ${tx?.code}`);
    }
  } catch (error) {
    console.error("❌ [PROCESS_ACTION] Execution failed:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    setError(error instanceof Error ? error.message : "Unknown error");
    setState('error');
    return null;
  }
}, [account, client, updateGameMatch, setCurrentMatch, gameMatches]);

  const execute = useCallback(async (matchId: number, decision: number) => {
    console.log("⚽ [PROCESS_ACTION] Processing match action", {
      matchId,
      decision,
      hasAccount: !!account,
      hasClient: !!client,
      accountAddress: account?.address
    });

    if (!account || !client) {
      const errorMsg = "No account connected";
      console.error("❌ [PROCESS_ACTION] Failed:", errorMsg);
      setError(errorMsg);
      setState('error');
      return;
    }

    try {
      setState('executing');
      setError(null);
      console.log("⏳ [PROCESS_ACTION] Calling contract function...");

      // 1️⃣ EXECUTE CONTRACT TRANSACTION
      // ✅ Use the actual decision passed from the UI
      const tx = await client!.game.processMatchAction(account, matchId, decision);
      console.log("📡 [PROCESS_ACTION] Transaction response:", {
        code: tx?.code,
        transactionHash: tx?.transaction_hash,
        fullResponse: tx
      });

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ [PROCESS_ACTION] Transaction successful");
        setState('success');

        // 2️⃣ WAIT FOR INDEXING
        console.log("⏳ [PROCESS_ACTION] Waiting for indexing (2s)...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3️⃣ FETCH REAL GAMEMATCH DATA FROM TORII
        console.log("🔄 [PROCESS_ACTION] Fetching real GameMatch data from Torii...");
        try {
          const result = await fetchGameMatch(matchId);
          console.log("📊 [PROCESS_ACTION] Real GameMatch result fetched:", result);
          
          if (result && result.gameMatchData) {
            const realGameMatchData = result.gameMatchData;
            // 4️⃣ UPDATE STORE WITH REAL DATA
            console.log("🔄 [PROCESS_ACTION] Updating store with real data");
            updateGameMatch(matchId, realGameMatchData);

            // 5️⃣ SET AS CURRENT MATCH WITH REAL DATA
            setCurrentMatch(realGameMatchData);
            console.log("📝 [PROCESS_ACTION] Current match updated with real data:", realGameMatchData);
            console.log("🎯 [PROCESS_ACTION] Real next_match_action_minute:", realGameMatchData.next_match_action_minute);
          } else {
            console.warn("⚠️ [PROCESS_ACTION] No real data found");
          }
        } catch (fetchError) {
          console.error("❌ [PROCESS_ACTION] Failed to fetch real data:", fetchError);
        }

        // Reset state after processing
        setTimeout(() => {
          setState('idle');
        }, 1000);

      } else {
        throw new Error(`Transaction failed: ${tx?.code}`);
      }
    } catch (error) {
      console.error("❌ [PROCESS_ACTION] Execution failed:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : "Unknown error");
      setState('error');
    }
  }, [account, client, updateGameMatch, setCurrentMatch, gameMatches]);

  return {
    execute,
    choseAction,
    state,
    error,
  };
}; 