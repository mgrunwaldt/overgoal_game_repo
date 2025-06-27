import React, { useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import useAppStore from "../../zustand/store";
import { fetchGameMatch } from './useGameMatch';

export type UseProcessMatchActionReturn = {
  execute: (matchId: number) => Promise<void>;
  state: 'idle' | 'executing' | 'success' | 'error';
  error: string | null;
};

export const useProcessMatchAction = (): UseProcessMatchActionReturn => {
  const { account } = useAccount();
  const { client } = useDojoSDK();
  const { updateGameMatch, setCurrentMatch, gameMatches } = useAppStore();

  const [state, setState] = React.useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const execute = useCallback(async (matchId: number) => {
    console.log("⚽ [PROCESS_ACTION] Processing match action", {
      matchId,
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
      // ✅ FIX: Call processMatchAction instead of startGamematch
      // For now, we use decision 2 (Simulate) as default until decision UI is implemented
      const matchDecision = 2; // 2 = Simulate (default action)
      const tx = await client!.game.processMatchAction(account, matchId, matchDecision);
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
    state,
    error,
  };
}; 