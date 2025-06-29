import React, { useState, useEffect, useRef, useCallback } from "react";
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

const MatchComponent = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { currentMatch, matchTimelineEvents } = useAppStore();
  const { player } = usePlayer();
  const { execute: processNextAction, state: processState } = useProcessMatchAction();
  const { getGameMatch } = useGameMatch(matchId ? parseInt(matchId) : 0);

  // 🎯 SIMPLE STATE STRUCTURE
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [eventsToProcess, setEventsToProcess] = useState<MatchTimelineEvent[]>([]);
  const [displayedEvents, setDisplayedEvents] = useState<UIMatchEvent[]>([]);
  const [displayedScore, setDisplayedScore] = useState({ myTeam: 0, opponent: 0 });
  const [isWaitingForUserAction, setIsWaitingForUserAction] = useState(false);
  const [isProcessingGoal, setIsProcessingGoal] = useState(false);
  const [isScoreBlinking, setIsScoreBlinking] = useState(false);
  const [isDecisionOpen, setDecisionOpen] = useState(false);

  // 🎯 SIMPLE REFS
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const currentMinuteRef = useRef<number>(0);
  const eventsToProcessRef = useRef<MatchTimelineEvent[]>([]);
  const isProcessingGoalRef = useRef<boolean>(false);

  const stamina = player?.stamina || 100;

  // 🎯 SCORE BLINKING CSS
  const scoreBlinkingStyle = `
    @keyframes dramaticBlink {
      0%, 100% { 
        opacity: 1; 
        transform: scale(1); 
        color: white;
        text-shadow: 0 0 10px #0ff;
      }
      25% { 
        opacity: 0.2; 
        transform: scale(1.2); 
        color: #ffd700;
        text-shadow: 0 0 25px #ffd700, 0 0 40px #ffd700;
      }
      50% { 
        opacity: 1; 
        transform: scale(1.3); 
        color: #ff6b35;
        text-shadow: 0 0 30px #ff6b35, 0 0 50px #ff6b35;
      }
      75% { 
        opacity: 0.3; 
        transform: scale(1.15); 
        color: #00ff00;
        text-shadow: 0 0 25px #00ff00, 0 0 40px #00ff00;
      }
    }
    .score-blinking {
      animation: dramaticBlink 0.3s ease-in-out 8;
    }
  `;

  // 🎯 STEP 1: Initialize when match data arrives 
  useEffect(() => {
    if (!currentMatch || !matchTimelineEvents) {
      console.log("❌ No match data yet");
      return;
    }

    console.log("🔄 === USEEFFECT TRIGGERED ===");
    console.log("🏁 Match data updated:", currentMatch.match_id, "Events:", matchTimelineEvents.length);
    console.log("📊 Current match state:", {
      match_id: currentMatch.match_id,
      prev_time: currentMatch.prev_time,
      next_action_minute: currentMatch.next_match_action_minute,
      current_time: currentMatch.current_time
    });
    console.log("📋 All timeline events:", matchTimelineEvents.map(e => ({
      id: e.event_id,
      minute: e.minute,
      action: e.action,
      team_scored: e.team_scored,
      opponent_team_scored: e.opponent_team_scored
    })));

    // Always clear any existing timer first
    if (timerRef.current) {
      console.log("⏹️ Clearing existing timer");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate initial score from events that already happened (≤ prev_time)
    let initialScore = { myTeam: 0, opponent: 0 };
    console.log("📈 Calculating initial score from events ≤", currentMatch.prev_time);
    matchTimelineEvents.forEach(evt => {
      if (evt.minute <= currentMatch.prev_time) {
        console.log(`  ✅ Event ${evt.event_id} at minute ${evt.minute} already happened`);
        if (evt.team_scored) {
          initialScore.myTeam += 1;
          console.log(`    🥅 My team goal! Score now: ${initialScore.myTeam}-${initialScore.opponent}`);
        }
        if (evt.opponent_team_scored) {
          initialScore.opponent += 1;
          console.log(`    🥅 Opponent goal! Score now: ${initialScore.myTeam}-${initialScore.opponent}`);
        }
      }
    });
    console.log("📊 Initial score set to:", initialScore);
    setDisplayedScore(initialScore);

    // Set events to process (> prev_time and < next_action_minute)
    const eventsForThisPhase = matchTimelineEvents
      .filter(evt => evt.minute > currentMatch.prev_time && evt.minute < currentMatch.next_match_action_minute)
      .sort((a, b) => a.minute - b.minute);
    
    console.log("📋 Events to process this phase:", eventsForThisPhase.length);
    eventsForThisPhase.forEach(evt => {
      console.log(`  📝 Event ${evt.event_id}: minute ${evt.minute}, action ${evt.action}, goal: ${evt.team_scored || evt.opponent_team_scored}`);
    });
    
    setEventsToProcess(eventsForThisPhase);
    eventsToProcessRef.current = eventsForThisPhase;
    setCurrentMinute(currentMatch.prev_time);
    currentMinuteRef.current = currentMatch.prev_time;
    setIsWaitingForUserAction(false);

    // Start fresh timer if we have events to process
    if (eventsForThisPhase.length > 0) {
      console.log("🎬 Starting timer - events to process");
      startTimer();
    } else {
      console.log("⏸️ No events to process, waiting for user action");
      setIsWaitingForUserAction(true);
    }
    console.log("🔄 === USEEFFECT COMPLETE ===");

  }, [currentMatch, matchTimelineEvents]);

  // 🎯 STEP 2: Simple timer that ticks every 0.3 seconds
  const startTimer = () => {
    console.log("🎬 === STARTING TIMER ===");
    
    // ALWAYS clear any existing timer first
    if (timerRef.current) {
      console.log("⏹️ Clearing existing timer");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    console.log(`🎬 Timer starting from minute: ${currentMinuteRef.current}`);

    timerRef.current = setInterval(() => {
      console.log("⏰ Timer tick");
      
      // Don't tick if processing goal
      if (isProcessingGoalRef.current) {
        console.log("⏸️ Skipping tick - processing goal");
        return;
      }

      currentMinuteRef.current += 1;
      const newMinute = currentMinuteRef.current;
      console.log(`⏰ Timer advancing to minute ${newMinute}`);
      
      // Update display minute
      setCurrentMinute(newMinute);
      
      // Process events for this minute immediately
      processEventsForMinuteWithRefs(newMinute);
      
    }, 300); // 0.3 seconds per tick
    
    console.log("✅ Timer started");
  };

  // 🎯 STEP 3: Process events for current minute (using refs to avoid re-renders)
  const processEventsForMinuteWithRefs = (minute: number) => {
    console.log(`🔍 === PROCESSING MINUTE ${minute} ===`);
    
    const currentEvents = eventsToProcessRef.current;
    console.log(`📋 Current events in queue: ${currentEvents.length}`);
    const eventsThisMinute = currentEvents.filter(evt => evt.minute === minute);
    console.log(`📝 Events for minute ${minute}:`, eventsThisMinute.length);
    
    if (eventsThisMinute.length > 0) {
      console.log("🎯 Processing events for this minute:");
      // Process each event
      eventsThisMinute.forEach((evt, index) => {
        console.log(`  📝 Event ${index + 1}/${eventsThisMinute.length}: ID ${evt.event_id}, minute ${evt.minute}`);
        if (evt.team_scored || evt.opponent_team_scored) {
          console.log(`    🥅 GOAL EVENT - calling processGoalEvent`);
          // Goal event - special processing
          processGoalEvent(evt);
        } else {
          console.log(`    ⚽ REGULAR EVENT - calling processRegularEvent`);
          // Regular event
          processRegularEvent(evt);
        }
      });
      
      // Remove processed events
      const remainingEvents = currentEvents.filter(evt => evt.minute !== minute);
      console.log(`📋 Removed ${eventsThisMinute.length} events, ${remainingEvents.length} remaining`);
      eventsToProcessRef.current = remainingEvents;
      setEventsToProcess(remainingEvents);
    }

    // Check if we should wait for user action
    if (eventsToProcessRef.current.length === 0 && currentMatch && minute >= currentMatch.next_match_action_minute) {
      console.log("🛑 No more events and reached action minute - stopping timer");
      stopTimerAndWaitForUser();
    }
    
    console.log(`✅ === MINUTE ${minute} PROCESSING COMPLETE ===`);
  };

  // 🎯 Process regular events (0.6s delay)
  const processRegularEvent = (evt: MatchTimelineEvent) => {
    console.log(`⚽ Processing regular event ${evt.event_id} - setting 0.6s timeout`);
    setTimeout(() => {
      console.log(`📺 Displaying regular event ${evt.event_id}`);
      const eventText = getTimelineEventText(evt.action, evt.team);
      const uiEvent: UIMatchEvent = {
        text: `${evt.minute}' - ${eventText}`,
        playable: false,
        team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral"
      };
      setDisplayedEvents(prev => {
        console.log(`📺 Adding regular event to display: "${uiEvent.text}"`);
        return [...prev, uiEvent];
      });
    }, 1000); // 0.6 seconds delay
  };

  // 🎯 Process goal events (0.6s + 0.6s delays)
  const processGoalEvent = (evt: MatchTimelineEvent) => {
    console.log(`🥅 === PROCESSING GOAL EVENT ${evt.event_id} ===`);
    console.log(`🔒 Setting isProcessingGoal = true`);
    setIsProcessingGoal(true);
    isProcessingGoalRef.current = true;

    // Step 1: Show regular event first (0.6s delay)
    setTimeout(() => {
      console.log(`📺 Step 1: Displaying regular part of goal event ${evt.event_id}`);
      const eventText = getTimelineEventText(evt.action, evt.team);
      const regularEvent: UIMatchEvent = {
        text: `${evt.minute}' - ${eventText}`,
        playable: false,
        team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral"
      };
      setDisplayedEvents(prev => {
        console.log(`📺 Adding goal regular event: "${regularEvent.text}"`);
        return [...prev, regularEvent];
      });

      // Step 2: Show goal event after another 0.6s
      setTimeout(() => {
        console.log(`🎉 Step 2: Displaying GOAL part of event ${evt.event_id}`);
        const goalEvent: UIMatchEvent = {
          text: `${evt.minute}' - 🎉⚽ GOOOOOAL! ${evt.team_scored ? "🔥 YOUR TEAM SCORES! 🔥" : "💀 OPPONENT SCORES! 💀"} ⚽🎉`,
          playable: false,
          team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral"
        };
        setDisplayedEvents(prev => {
          console.log(`🎉 Adding goal celebration: "${goalEvent.text}"`);
          return [...prev, goalEvent];
        });

        // Update score
        console.log("📊 Updating score...");
        if (evt.team_scored) {
          console.log("🥅 MY TEAM SCORED!");
          setDisplayedScore(prev => {
            const newScore = { ...prev, myTeam: prev.myTeam + 1 };
            console.log(`📊 Score updated: ${newScore.myTeam}-${newScore.opponent}`);
            return newScore;
          });
        }
        if (evt.opponent_team_scored) {
          console.log("🥅 OPPONENT SCORED!");
          setDisplayedScore(prev => {
            const newScore = { ...prev, opponent: prev.opponent + 1 };
            console.log(`📊 Score updated: ${newScore.myTeam}-${newScore.opponent}`);
            return newScore;
          });
        }

        // Trigger score blinking
        console.log("✨ Triggering score blinking");
        triggerScoreBlinking();

        // Allow timer to continue
        console.log(`🔓 Setting isProcessingGoal = false`);
        setIsProcessingGoal(false);
        isProcessingGoalRef.current = false;
        console.log(`✅ === GOAL EVENT ${evt.event_id} COMPLETE ===`);
      }, 1200); // Another 0.6s delay

    }, 1200); // Initial 0.6s delay
  };

  // 🎯 Stop timer and wait for user
  const stopTimerAndWaitForUser = () => {
    console.log("🛑 === STOPPING TIMER ===");
    if (timerRef.current) {
      console.log("⏹️ Clearing timer interval");
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else {
      console.log("⚠️ No timer to clear");
    }
    console.log("👤 Setting waiting for user action = true");
    setIsWaitingForUserAction(true);
  };

  // 🎯 Handle user action
  const handleNextAction = async () => {
    console.log("🎮 === USER ACTION CLICKED ===");
    if (!currentMatch || !isWaitingForUserAction) {
      console.log("❌ Cannot process action - no match or not waiting");
      return;
    }

    try {
      console.log("🔄 Processing user action...");
      setIsWaitingForUserAction(false);
      
      // Add interactive event to timeline
      const interactiveEvent: UIMatchEvent = {
        text: `${currentMatch.next_match_action_minute}' - ${getTimelineEventText(currentMatch.next_match_action, currentMatch.action_team)} - YOU PARTICIPATED`,
        playable: false,
        team: currentMatch.action_team === 0 ? "player" : currentMatch.action_team === 1 ? "enemy" : "neutral"
      };
      console.log("📺 Adding interactive event:", interactiveEvent.text);
      setDisplayedEvents(prev => [...prev, interactiveEvent]);
      
      // Call backend
      console.log("🌐 Calling backend processNextAction...");
      await processNextAction(currentMatch.match_id);
      console.log("🌐 Calling backend getGameMatch...");
      await getGameMatch();
      
      console.log("✅ Action processed, new match data will restart timer");
    } catch (error) {
      console.log("❌ Error processing action:", error);
      setIsWaitingForUserAction(true);
    }
  };

  // 🎯 Helper functions
  const triggerScoreBlinking = () => {
    console.log("✨ Score blinking triggered");
    setIsScoreBlinking(true);
    setTimeout(() => {
      console.log("✨ Score blinking ended");
      setIsScoreBlinking(false);
    }, 2500);
  };

  const getTimelineEventText = (action: number, team: number): string => {
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
    
    const teamText = team === 0 ? "Your team" : "Opponent team";
    switch (action) {
      case 0: return `${teamText} continues with open play`;
      case 1: return `${teamText} player jumps for the ball`;
      case 2: return "Brawl breaks out on the field";
      case 3: return `${teamText} gets a free kick`;
      case 4: return `${teamText} awarded a penalty`;
      case 5: return `${teamText} makes a defensive play`;
      case 6: return "🕐 HALF TIME - Players take a break";
      case 7: return "⏱️ FULL TIME - Match has ended";
      case 8: return `${teamText} makes a substitution`;
      default: return `${teamText} match action`;
    }
  };

  // 🎯 Auto-scroll events
  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
    }
  }, [displayedEvents]);

  // 🎯 Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <style>{scoreBlinkingStyle}</style>
      
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-between py-8 px-4 bg-cover bg-center transition-filter duration-300 ${
          isDecisionOpen ? "blur-sm" : ""
        }`}
        style={{ backgroundImage: "url('/match/BackGround.png')" }}
      >
        <div className="flex flex-col items-center">
          {/* Score and Timer */}
          <div
            className="w-56 h-28 bg-contain bg-no-repeat bg-center flex flex-col items-center justify-center"
            style={{ backgroundImage: "url('/match/Contador.png')" }}
          >
            <p
              className={`text-white text-4xl font-bold -mt-2 transition-all duration-300 ${
                isScoreBlinking ? 'score-blinking' : ''
              }`}
              style={{ textShadow: "0 0 10px #0ff" }}
            >
              {displayedScore.myTeam} - {displayedScore.opponent}
            </p>
            <p
              className="text-white text-2xl"
              style={{ textShadow: "0 0 10px #0ff" }}
            >
              {currentMinute}'
            </p>
          </div>

          {/* Match Simulation */}
          <div
            className="w-[350px] h-[350px] bg-contain bg-no-repeat bg-center flex items-center justify-center px-10"
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
                {displayedEvents.map((event, index) => (
                  <MatchEventIten
                    key={index}
                    text={event.text}
                    playable={event.playable}
                    team={event.team}
                  />
                ))}
                {isWaitingForUserAction && currentMatch && (
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

        {/* Action Button */}
        {isWaitingForUserAction && currentMatch && currentMatch.current_time < 90 && (
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={handleNextAction}
              disabled={processState === 'executing'}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {processState === 'executing' ? 'Processing...' : `Next Action (${currentMinute}')`}
            </button>
          </div>
        )}

        <img src="/match/Logo.png" alt="Logo" className="w-24 h-24" />
        
        {/* End Match Button */}
        {(currentMatch?.current_time || 1) >= 90 && (
          <div className="w-full flex justify-end mt-12">
            <button
              onClick={() => navigate(`/match-end/${matchId}`)}
              className="w-40 h-14 bg-contain bg-no-repeat bg-center text-white text-lg font-bold flex items-center justify-center pr-4 transition-transform transform hover:scale-105"
              style={{ backgroundImage: "url('/nonMatchResult/Next Button.png')" }}
            ></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchComponent;
