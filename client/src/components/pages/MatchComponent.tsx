import React, { useState, useEffect, useRef } from "react";
import MatchEventIten from "../ui/matchEventIten";
import StaminaBar from "../ui/StaminaBar";
import MatchDecision from "./MatchDecision";
import { useNavigate, useParams } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";
import useAppStore from "../../zustand/store";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useProcessMatchAction } from "../../dojo/hooks/useProcessMatchAction";
import { useGameMatch } from "../../dojo/hooks/useGameMatch";

interface MatchEvent {
  text: string;
  playable: boolean;
  team: "player" | "enemy";
}

// Removed static event arrays - now using real match data

const MatchComponent = () => {
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [isDecisionOpen, setDecisionOpen] = useState(false);
  const [displayTime, setDisplayTime] = useState<number>(1); // Live timer that counts up
  const [isWaitingForAction, setIsWaitingForAction] = useState(false);
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { currentMatch, gameMatches } = useAppStore();
  const { player } = usePlayer();
  const { execute: processNextAction, state: processState } =
    useProcessMatchAction();
  const { fetchGameMatch } = useGameMatch();

  // Find the current match
  const match =
    currentMatch ||
    gameMatches.find((m) => m.match_id === parseInt(matchId || "0"));
  const stamina = player?.stamina || 100;

  // Force fetch fresh match data on component mount
  useEffect(() => {
    if (matchId) {
      console.log("🔄 [MATCH_COMPONENT] Fetching fresh match data on mount", {
        matchId,
      });
      fetchGameMatch(parseInt(matchId));
    }
  }, [matchId, fetchGameMatch]);

  // Debug logging for match component initialization
  React.useEffect(() => {
    console.log("🏟️ [MATCH_COMPONENT] Component initialized", {
      matchId: matchId,
      hasCurrentMatch: !!currentMatch,
      hasFoundMatch: !!match,
      matchData: match,
      gameMatchesCount: gameMatches.length,
      playerStamina: stamina,
    });
  }, [matchId, currentMatch, match, gameMatches.length, stamina]);

  // Match flow logic - simplified and fixed
  useEffect(() => {
    console.log("⚽ [MATCH_FLOW] Effect triggered", {
      hasMatch: !!match,
      currentTime: match?.current_time,
      prevTime: match?.prev_time,
      nextActionMinute: match?.next_match_action_minute,
      matchStatus: match?.match_status,
    });

    if (!match) {
      console.warn("⚠️ [MATCH_FLOW] No match data available");
      return;
    }

    // Initialize display time to previous time (where timer should start from)
    const startTime =
      match.prev_time !== undefined ? match.prev_time : match.current_time || 1;
    console.log("🎯 [MATCH_FLOW] Setting initial display time", {
      prevTime: match.prev_time,
      currentTime: match.current_time,
      calculatedStartTime: startTime,
      nextActionMinute: match.next_match_action_minute,
    });
    setDisplayTime(startTime);

    // If match is finished, navigate to match end
    if (match.current_time >= 90) {
      console.log("🏁 [MATCH_FLOW] Match finished, navigating to match end");
      navigate(`/match-end/${match.match_id}`);
      return;
    }

    // Check timer logic conditions
    const hasNextAction = !!match.next_match_action_minute;
    const shouldStartTimer =
      hasNextAction && startTime < match.next_match_action_minute;
    const shouldShowAction =
      hasNextAction && startTime >= match.next_match_action_minute;

    console.log("🔍 [MATCH_FLOW] Timer decision logic", {
      hasNextAction,
      shouldStartTimer,
      shouldShowAction,
      startTime,
      nextActionMinute: match.next_match_action_minute,
    });

    // If we have a next action time, start counting UP to it
    if (shouldStartTimer) {
      console.log("⏰ [MATCH_FLOW] Starting timer count up", {
        startTime: startTime,
        targetTime: match.next_match_action_minute,
      });

      setIsWaitingForAction(false);

      const countUpInterval = setInterval(() => {
        setDisplayTime((prevDisplayTime) => {
          const nextTime = prevDisplayTime + 1;

          console.log(
            "⏳ [MATCH_FLOW] Timer counting up:",
            nextTime,
            "target:",
            match.next_match_action_minute
          );

          // When we reach the target time, show action button
          if (nextTime >= match.next_match_action_minute) {
            console.log(
              "🔔 [MATCH_FLOW] Reached action time, ready for action"
            );
            clearInterval(countUpInterval);
            setIsWaitingForAction(true);
          }

          return nextTime;
        });
      }, 500); // 🏃‍♂️ Count up every 0.5 seconds (2x faster)

      return () => {
        console.log("🧹 [MATCH_FLOW] Cleaning up count up interval");
        clearInterval(countUpInterval);
      };
    } else if (shouldShowAction) {
      // Already time for next action
      console.log("⚡ [MATCH_FLOW] Already time for next action!");
      setIsWaitingForAction(true);
    } else {
      console.log(
        "🤔 [MATCH_FLOW] No next action minute set or invalid condition",
        {
          hasNextActionMinute: !!match.next_match_action_minute,
          nextActionMinute: match.next_match_action_minute,
          startTime,
          comparison: startTime < match.next_match_action_minute,
        }
      );
    }
  }, [match, navigate]);

  // Handle processing next action
  const handleNextAction = async () => {
    console.log("🎯 [HANDLE_ACTION] Action button clicked", {
      hasMatch: !!match,
      isWaitingForAction,
      matchId: match?.match_id,
      displayTime: displayTime,
      nextAction: match?.next_match_action,
      playerParticipation: match?.player_participation,
      actionTeam: match?.action_team,
    });

    if (!match || !isWaitingForAction) {
      console.warn("⚠️ [HANDLE_ACTION] Cannot process action", {
        hasMatch: !!match,
        isWaitingForAction,
      });
      return;
    }

    try {
      console.log("⏳ [HANDLE_ACTION] Processing action...");
      await processNextAction(match.match_id);
      setIsWaitingForAction(false);

      // Add event to the list based on the action
      const newEvent: MatchEvent = {
        text: getActionText(match.next_match_action || 0),
        playable: match.player_participation === 1, // Participating
        team: match.action_team === 0 ? "player" : "enemy",
      };

      console.log("📝 [HANDLE_ACTION] Adding new event to list", {
        event: newEvent,
        currentEventsCount: matchEvents.length,
      });

      setMatchEvents((prev) => {
        const newEvents = [...prev, newEvent];
        console.log("📋 [HANDLE_ACTION] Updated events list", {
          previousCount: prev.length,
          newCount: newEvents.length,
          latestEvent: newEvent,
        });
        return newEvents;
      });

      console.log("✅ [HANDLE_ACTION] Action processed successfully");
    } catch (error) {
      console.error("❌ [HANDLE_ACTION] Failed to process action:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  // Helper function to convert action enum to text
  const getActionText = (action: number): string => {
    switch (action) {
      case 0:
        return "Open Play continues";
      case 1:
        return "Player jumps for the ball";
      case 2:
        return "Brawl breaks out";
      case 3:
        return "Free Kick opportunity";
      case 4:
        return "Penalty awarded";
      case 5:
        return "Defensive play";
      case 6:
        return "🕐 HALF TIME - Take a break"; // 🆕 NEW
      case 7:
        return "⏱️ FULL TIME - Match finished"; // 🆕 NEW
      default:
        return "Match action";
    }
  };

  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop =
        eventContainerRef.current.scrollHeight;
    }
  }, [matchEvents]);

  // Log UI state changes
  useEffect(() => {
    console.log("🎨 [MATCH_UI] UI state update", {
      isWaitingForAction,
      displayTime,
      processState,
      showActionButton: isWaitingForAction && match && match.current_time < 90,
      showFinishButton: (match?.current_time || 1) >= 90,
      matchEventsCount: matchEvents.length,
    });
  }, [
    isWaitingForAction,
    displayTime,
    processState,
    match?.current_time,
    matchEvents.length,
  ]);

  return (
    <div className="relative min-h-screen">
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-between py-8 px-4 bg-cover bg-center transition-filter duration-300 ${
          isDecisionOpen ? "blur-sm" : ""
        }`}
        style={{ backgroundImage: "url('/match/BackGround.png')" }}
      >
        <div className="flex flex-col items-center">
          {/* Top Section: Score and Timer */}
          <div
            className="w-56 h-28 bg-contain bg-no-repeat bg-center flex flex-col items-center justify-center"
            style={{ backgroundImage: "url('/match/Contador.png')" }}
          >
            <p
              className="text-white text-4xl font-bold -mt-2"
              style={{ textShadow: "0 0 10px #0ff" }}
            >
              {match?.my_team_score || 0} - {match?.opponent_team_score || 0}
            </p>
            <p
              className="text-white text-2xl"
              style={{ textShadow: "0 0 10px #0ff" }}
            >
              {displayTime}'
            </p>
          </div>

          {/* Match Simulation */}
          <div
            className="w-[350px] h-[350px] bg-contain bg-no-repeat bg-center flex items-center justify-center  px-10"
            style={{ backgroundImage: "url('/match/Match sim.png')" }}
          >
            <img
              src="/match/matchGame.png"
              alt="Match Simulation"
              className="object-contain"
            />
          </div>

          {/* Stamina Bar */}
          <div className="">
            <StaminaBar useAnimation={true} initialStamina={stamina} />
          </div>

          {/* Match Events */}
          <div
            className="w-[380px] h-[320px] bg-black/30 bg-contain bg-no-repeat bg-center mt-4 flex justify-center items-start pt-16 px-10"
            style={{ backgroundImage: "url('/match/Match events.png')" }}
          >
            <div
              ref={eventContainerRef}
              className="w-full h-[90%] rounded-lg p-4 overflow-y-auto"
            >
              <ul className="text-white space-y-1 text-lg font-sans font-normal tracking-wide">
                {matchEvents.map((event, index) => (
                  <MatchEventIten
                    key={index}
                    text={event.text}
                    playable={event.playable}
                    team={event.team}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action button for when it's time for next action */}
        {isWaitingForAction && match && match.current_time < 90 && (
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={handleNextAction}
              disabled={processState === "executing"}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {processState === "executing"
                ? "Processing..."
                : `Next Action (${displayTime}')`}
            </button>
          </div>
        )}

        <img src="/match/Logo.png" alt="Logo" className="w-24 h-24" />
        {(match?.current_time || 1) >= 90 && (
          <div className="w-full flex justify-end mt-12">
            <button
              onClick={() => {
                navigate(`/match-end/${matchId}`);
              }}
              className="w-40 h-14 bg-contain bg-no-repeat bg-center text-white text-lg font-bold flex items-center justify-center pr-4 transition-transform transform hover:scale-105"
              style={{
                backgroundImage: "url('/nonMatchResult/Next Button.png')",
              }}
            ></button>
          </div>
        )}
      </div>

      <MatchDecision
        isOpen={isDecisionOpen}
        onClose={() => setDecisionOpen(false)}
      />
    </div>
  );
};

export default MatchComponent;
