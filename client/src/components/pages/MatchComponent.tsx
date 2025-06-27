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
import { MatchTimelineEvent } from "../../dojo/hooks/types";

interface UIMatchEvent {
  text: string;
  playable: boolean;
  team: "player" | "enemy" | "neutral";
}

// Removed static event arrays - now using real match data

const MatchComponent = () => {
  const [displayedEvents, setDisplayedEvents] = useState<UIMatchEvent[]>([]);
  const [isDecisionOpen, setDecisionOpen] = useState(false);
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [isWaitingForAction, setIsWaitingForAction] = useState(false);
  
  // ✅ NEW: Proper state management for timeline events processing
  const [processingQueue, setProcessingQueue] = useState<MatchTimelineEvent[]>([]);
  const [isProcessingEvents, setIsProcessingEvents] = useState(false);
  
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { currentMatch, matchTimelineEvents } = useAppStore();
  const { player } = usePlayer();
  const { execute: processNextAction, state: processState } = useProcessMatchAction();
  const { getGameMatch } = useGameMatch(matchId ? parseInt(matchId) : 0);

  const stamina = player?.stamina || 100;

  // Debug logging for match component initialization
  React.useEffect(() => {
    if (matchTimelineEvents.length > 0) {
      console.log("📊 Timeline Events RAW:", matchTimelineEvents);
    }
  }, [matchTimelineEvents]);

  // ✅ NEW: Initialize processing queue when match data changes
  useEffect(() => {
    if (!currentMatch) {
      return;
    }

    console.log("📝 [START_MATCH] Current match updated with real data:", currentMatch);

    // Create processing queue: events that happen after prev_time and before next action
    const eventsToProcess = [...matchTimelineEvents]
      .filter(event => event.minute > currentMatch.prev_time && event.minute < currentMatch.next_match_action_minute)
      .sort((a, b) => a.minute - b.minute);

    setProcessingQueue(eventsToProcess);
    setDisplayTime(currentMatch.prev_time);
    setIsWaitingForAction(false);
    setIsProcessingEvents(false);

    // Start the processing algorithm
    startEventProcessing();

  }, [currentMatch, matchTimelineEvents]);

  // ✅ NEW: The main algorithm implementation
  const startEventProcessing = () => {
    if (!currentMatch) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsProcessingEvents(true);
    
    // Start the minute-by-minute timer
    timerRef.current = setInterval(() => {
      setDisplayTime(prevTime => {
        const nextMinute = prevTime + 1;

        // Check if we have events for this minute in our processing queue
        setProcessingQueue(currentQueue => {
          const eventsThisMinute = currentQueue.filter(event => event.minute === nextMinute);
          
          if (eventsThisMinute.length > 0) {
            // Show the events in UI
            const newDisplayedEvents: UIMatchEvent[] = eventsThisMinute.map(evt => ({
              text: `${evt.minute}' - ${getTimelineEventText(evt.action, evt.team)}`,
              playable: false,
              team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral"
            }));
            setDisplayedEvents(prev => [...prev, ...newDisplayedEvents]);
            
            // Remove processed events from queue
            return currentQueue.filter(event => event.minute !== nextMinute);
          }
          
          return currentQueue;
        });

        // Check if we've reached the action minute or if queue is empty
        if (nextMinute >= (currentMatch?.next_match_action_minute || 90)) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setIsProcessingEvents(false);
          setIsWaitingForAction(true);
        }

        return nextMinute;
      });
    }, 500); // 0.5 seconds per minute (twice as fast)
  };

  // ✅ Check if queue is empty and we should show action button
  useEffect(() => {
    if (!isProcessingEvents && processingQueue.length === 0 && currentMatch && displayTime < currentMatch.next_match_action_minute) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsWaitingForAction(true);
    }
  }, [processingQueue.length, isProcessingEvents, currentMatch, displayTime]);

  // Handle processing next action (the user-interactive one)
  const handleNextAction = async () => {
    if (!currentMatch || !isWaitingForAction) return;

    try {
      console.log("🎮 [ACTION] User clicked next action");
      setIsWaitingForAction(false);
      
      // ✅ FIX: Add the interactive event to displayed events when user clicks
      const interactiveEvent: UIMatchEvent = {
        text: `${currentMatch.next_match_action_minute}' - ${getTimelineEventText(currentMatch.next_match_action, currentMatch.action_team)} - YOU PARTICIPATED`,
        playable: false,
        team: currentMatch.action_team === 0 ? "player" : currentMatch.action_team === 1 ? "enemy" : "neutral"
      };
      setDisplayedEvents(prev => [...prev, interactiveEvent]);
      
      // Process the action, which will trigger the simulation for the *next* batch of events
      await processNextAction(currentMatch.match_id);
      
      // After processing, manually refetch the match state
      await getGameMatch();
      
      console.log("✅ [ACTION] Action processed, new match data should trigger re-initialization");
    } catch (error) {
      setIsWaitingForAction(true); // Re-enable button on error
    }
  };

  // Helper function to convert action enum to text
  const getActionText = (action: number): string => {
    switch (action) {
      case 0: return "Open Play continues";
      case 1: return "Player jumps for the ball";
      case 2: return "Brawl breaks out";
      case 3: return "Free Kick opportunity";
      case 4: return "Penalty awarded";
      case 5: return "Defensive play";
      case 6: return "🕐 HALF TIME - Take a break";
      case 7: return "⏱️ FULL TIME - Match finished";
      case 8: return "Player substitution";
      default: return "Match action";
    }
  };

  // ✅ NEW: Helper function specifically for timeline events
  const getTimelineEventText = (action: number, team: number): string => {
    // Handle neutral team (action_team = 2)
    if (team === 2) {
      switch (action) {
        case 0: return "Open play continues";
        case 1: return "Player jumps for the ball";
        case 2: return "Brawl breaks out on the field";
        case 3: return "Free kick awarded";
        case 4: return "Penalty awarded";
        case 5: return "Defensive play occurs";
        case 6: return "🕐 HALF TIME - Players take a break";
        case 7: return "⏱️ FULL TIME - Match has ended";
        case 8: return "Player substitution made";
        default: return "Match action occurs";
      }
    }
    
    // Handle team-specific actions (team 0 = Your team, team 1 = Opponent team)
    const teamText = team === 0 ? "Your team" : "Opponent team";
    
    switch (action) {
      case 0: return `${teamText} continues with open play`;
      case 1: return `${teamText} player jumps for the ball`;
      case 2: return `Brawl breaks out on the field`;
      case 3: return `${teamText} gets a free kick`;
      case 4: return `${teamText} awarded a penalty`;
      case 5: return `${teamText} makes a defensive play`;
      case 6: return "🕐 HALF TIME - Players take a break";
      case 7: return "⏱️ FULL TIME - Match has ended";
      case 8: return `${teamText} makes a substitution`;
      default: return `${teamText} match action`;
    }
  };

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
    }
  }, [displayedEvents]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Cleanup timer on unmount

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
              {currentMatch?.my_team_score || 0} - {currentMatch?.opponent_team_score || 0}
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
                {/* Render the dynamically displayed timeline events */}
                {displayedEvents.map((event, index) => (
                  <MatchEventIten
                    key={index}
                    text={event.text}
                    playable={event.playable}
                    team={event.team}
                  />
                ))}
                {/* Optionally, display the interactive event when its time comes */}
                {isWaitingForAction && currentMatch && (
                   <MatchEventIten
                    key="interactive"
                    text={`${currentMatch.next_match_action_minute}' - ${getTimelineEventText(currentMatch.next_match_action, currentMatch.action_team)}`}
                    playable={true}
                    team={currentMatch.action_team === 0 ? "player" : currentMatch.action_team === 1 ? "enemy" : "neutral"}
                  />
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action button for when it's time for next action */}
        {isWaitingForAction && currentMatch && currentMatch.current_time < 90 && (
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={handleNextAction}
              disabled={processState === 'executing'}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {processState === 'executing' ? 'Processing...' : `Next Action (${displayTime}')`}
            </button>
          </div>
        )}

        <img src="/match/Logo.png" alt="Logo" className="w-24 h-24" />
        {(currentMatch?.current_time || 1) >= 90 && (
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
    </div>
  );
};

export default MatchComponent;
