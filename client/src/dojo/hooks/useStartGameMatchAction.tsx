import React, { useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useNavigate } from "react-router-dom";
import { useDojoSDK } from "@dojoengine/sdk/react";
import useAppStore from "../../zustand/store";
import { fetchGameMatch } from './useGameMatch';

export type UseStartGameMatchActionReturn = {
  execute: (matchId: number) => Promise<void>;
  state: 'idle' | 'executing' | 'success' | 'error';
  error: string | null;
};

export const useStartGameMatchAction = (): UseStartGameMatchActionReturn => {
  const { account } = useAccount();
  const { client } = useDojoSDK();
  const navigate = useNavigate();
  const { updateGameMatch, setCurrentMatch, gameMatches } = useAppStore();

  const [state, setState] = React.useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const execute = useCallback(async (matchId: number) => {
    console.log("🎮 [START_MATCH] Starting match execution", {
      matchId,
      hasAccount: !!account,
      hasClient: !!client,
      accountAddress: account?.address
    });

    if (!account || !client) {
      const errorMsg = "No account connected";
      console.error("❌ [START_MATCH] Failed:", errorMsg);
      setError(errorMsg);
      setState('error');
      return;
    }

    try {
      setState('executing');
      setError(null);
      console.log("⏳ [START_MATCH] Calling contract function...");

      // 1️⃣ EXECUTE CONTRACT TRANSACTION
      const tx = await client!.game.startGamematch(account, matchId);
      console.log("📡 [START_MATCH] Transaction response:", {
        code: tx?.code,
        transactionHash: tx?.transaction_hash,
        fullResponse: tx
      });

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ [START_MATCH] Transaction successful");
        setState('success');

        // 2️⃣ WAIT FOR INDEXING
        console.log("⏳ [START_MATCH] Waiting for indexing (2s)...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3️⃣ FETCH REAL GAMEMATCH DATA FROM TORII
        console.log("🔄 [START_MATCH] Fetching real GameMatch data from Torii...");
        try {
          const realGameMatchData = await fetchGameMatch(matchId);
          console.log("📊 [START_MATCH] Real GameMatch data fetched:", realGameMatchData);
          
          if (realGameMatchData) {
            // 4️⃣ UPDATE STORE WITH REAL DATA
            console.log("🔄 [START_MATCH] Updating store with real data");
            updateGameMatch(matchId, realGameMatchData);

            // 5️⃣ SET AS CURRENT MATCH WITH REAL DATA
            setCurrentMatch(realGameMatchData);
            console.log("📝 [START_MATCH] Current match updated with real data:", realGameMatchData);
            console.log("🎯 [START_MATCH] Real next_match_action_minute:", realGameMatchData.next_match_action_minute);
          } else {
            console.warn("⚠️ [START_MATCH] No real data found, falling back to optimistic update");
            // Fallback to optimistic update
            updateGameMatch(matchId, { 
              match_status: 1, // InProgress
              current_time: 1 
            });

            const currentMatch = gameMatches.find(match => match.match_id === matchId);
            if (currentMatch) {
              const updatedMatch = {
                ...currentMatch,
                match_status: 1,
                current_time: 1
              };
              setCurrentMatch(updatedMatch);
            }
          }
        } catch (fetchError) {
          console.error("❌ [START_MATCH] Failed to fetch real data, using optimistic update:", fetchError);
          // Fallback to optimistic update
          updateGameMatch(matchId, { 
            match_status: 1, // InProgress
            current_time: 1 
          });

          const currentMatch = gameMatches.find(match => match.match_id === matchId);
          if (currentMatch) {
            const updatedMatch = {
              ...currentMatch,
              match_status: 1,
              current_time: 1
            };
            setCurrentMatch(updatedMatch);
          }
        }

        // 6️⃣ NAVIGATE TO MATCH SCREEN
        console.log("🧭 [START_MATCH] Navigating to match screen...");
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate(`/match/${matchId}`);
        console.log("✅ [START_MATCH] Navigation completed");

      } else {
        throw new Error(`Transaction failed: ${tx?.code}`);
      }
    } catch (error) {
      console.error("❌ [START_MATCH] Execution failed:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : "Unknown error");
      setState('error');
    }
  }, [account, client, navigate, updateGameMatch, setCurrentMatch, gameMatches]);

  return { execute, state, error };
}; 