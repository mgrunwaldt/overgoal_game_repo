import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useNavigate } from "react-router-dom";
import { useDojoSDK } from "@dojoengine/sdk/react";
import useAppStore from "../../zustand/store";
import { usePlayer } from "./usePlayer";
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
        console.log("$$$$$ Transaction successful, now fetching outcome data");

        // Wait a bit for the transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Refetch player data to get updated stats
        console.log("$$$$$ Refetching player data");
        await refetchPlayer();

        // Fetch all possible outcomes for this event
        console.log("$$$$$ Fetching outcome data for event_id:", eventId);
        const outcomes = await fetchNonMatchEventOutcomes(eventId);
        console.log("$$$$$ Fetched outcomes:", outcomes);

        if (outcomes.length === 0) {
          throw new Error("No outcomes found for this event");
        }

        // For now, we'll use the first outcome. 
        // TODO: We need to get the actual outcome_id from the transaction response
        // The contract returns (outcome_id, outcome_name, outcome_description) but we need to extract this
        const chosenOutcome = outcomes[0]; // This is a temporary solution
        
        console.log("$$$$$ Using outcome:", chosenOutcome);
        setLastNonMatchOutcome(chosenOutcome);
        console.log("$$$$$ Outcome data has been set in store");

        // Verify the state was actually set by getting it back from the store
        const { last_non_match_outcome } = useAppStore.getState();
        console.log("$$$$$ Verification - outcome in store after setting:", last_non_match_outcome);

        // Add a longer delay to ensure state updates propagate before navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify again after delay
        const { last_non_match_outcome: outcomeAfterDelay } = useAppStore.getState();
        console.log("$$$$$ Verification - outcome in store after delay:", outcomeAfterDelay);
        
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