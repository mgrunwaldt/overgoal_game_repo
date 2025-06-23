import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useNavigate } from "react-router-dom";
import { useDojoSDK } from "@dojoengine/sdk/react";
import useAppStore from "../../zustand/store";
import { usePlayer, fetchPlayerEventHistory } from "./usePlayer";
import { fetchNonMatchEventOutcomes } from "./useNonMatchEvents";

type ExecutionState = 'idle' | 'executing' | 'success' | 'error';

// Define the return type for the hook
interface UseExecuteNonMatchEventActionReturn {
  execute: (eventId: number) => Promise<void>;
  state: ExecutionState;
  error: string | null;
}

export const useExecuteNonMatchEventAction = (): UseExecuteNonMatchEventActionReturn => {
  const { account } = useAccount();
  const { client } = useDojoSDK();
  const navigate = useNavigate();
  const [state, setState] = useState<ExecutionState>('idle');
  const [error, setError] = useState<string | null>(null);

  const { setLastNonMatchOutcome } = useAppStore();
  const { refetch: refetchPlayer } = usePlayer();

  const execute = useCallback(async (eventId: number) => {
    console.log("$$$$$ Starting execute function with eventId:", eventId);

    if (!account || !client) {
      console.log("$$$$$ No account or client available");
      setError("No account connected");
      setState('error');
      return;
    }

    try {
      console.log("$$$$$ Setting state to executing");
      setState('executing');
      setError(null);

      console.log("$$$$$ About to call executeNonMatchEvent");
      const tx = await client!.game.executeNonMatchEvent(account, eventId);
      console.log("$$$$$ Transaction response received:", tx);

      if (tx && tx.code === "SUCCESS") {
        console.log("$$$$$ Transaction successful, now fetching player event history");

        // Wait a bit for the transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Refetch player data to get updated stats
        console.log("$$$$$ Refetching player data");
        await refetchPlayer();

        // Get the player address for fetching event history
        const playerAddress = account.address;
        console.log("$$$$$ Fetching PlayerEventHistory for player:", playerAddress);

        // Fetch the player's event history to get the last outcome_id
        const eventHistory = await fetchPlayerEventHistory(playerAddress);
        console.log("$$$$$ Fetched event history:", eventHistory);

        if (!eventHistory) {
          throw new Error("No event history found for player");
        }

        // Now fetch the specific outcome using event_id and outcome_id from history
        console.log("$$$$$ Fetching specific outcome for event_id:", eventHistory.last_event_id, "outcome_id:", eventHistory.last_outcome_id);
        const outcomes = await fetchNonMatchEventOutcomes(eventHistory.last_event_id);
        const specificOutcome = outcomes.find(outcome => outcome.outcome_id === eventHistory.last_outcome_id);

        if (!specificOutcome) {
          throw new Error(`No outcome found for event_id: ${eventHistory.last_event_id}, outcome_id: ${eventHistory.last_outcome_id}`);
        }
        
        console.log("$$$$$ Found specific outcome:", specificOutcome);
        setLastNonMatchOutcome(specificOutcome);
        console.log("$$$$$ Outcome data has been set in store");

        // Add a delay to ensure state updates propagate before navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setState('success');
        console.log("$$$$$ Navigating to NonMatchResult");
        navigate('/non-match-result');

      } else {
        console.log("$$$$$ Transaction failed:", tx?.code);
        throw new Error(`Transaction failed: ${tx?.code}`);
      }

    } catch (err) {
      console.log("$$$$$ Error in execute function:", err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setState('error');
    }
  }, [account, client, navigate, setLastNonMatchOutcome, refetchPlayer]);

  return {
    execute,
    state,
    error
  };
};