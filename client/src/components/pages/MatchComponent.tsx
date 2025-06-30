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

    // 🚨 ALWAYS clear any existing timer FIRST (from previous matches/navigation)
    if (timerRef.current) {
      console.log("🧹 Clearing any existing timer from previous session");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 🔧 RESET ALL REFS FOR NEW MATCH
    console.log("🔄 Resetting refs for new match");
    console.log(`📍 OLD refs - minute: ${currentMinuteRef.current}, events: ${eventsToProcessRef.current.length}, processing: ${isProcessingGoalRef.current}`);
    currentMinuteRef.current = currentMatch.prev_time;
    eventsToProcessRef.current = [];
    isProcessingGoalRef.current = false;
    console.log(`📍 NEW refs - minute: ${currentMinuteRef.current}, events: ${eventsToProcessRef.current.length}, processing: ${isProcessingGoalRef.current}`);

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
    setIsWaitingForUserAction(false);

    // Start fresh timer if we have events to process
    if (eventsForThisPhase.length > 0) {
      console.log("🎬 Starting timer - events to process");
      startTimer();
    } else {
      console.log("⏸️ No events to process between minutes", currentMatch.prev_time, "and", currentMatch.next_match_action_minute);
      console.log("🎬 Starting timer anyway - will tick until action minute");
      startTimer();
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
      const eventText = getTimelineEventText(evt.action, evt.team, evt.event_id);
      const uiEvent: UIMatchEvent = {
        text: `${evt.minute}' - ${eventText}`,
        playable: false,
        team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral"
      };
      setDisplayedEvents(prev => {
        console.log(`📺 Adding regular event to display: "${uiEvent.text}"`);
        return [...prev, uiEvent];
      });
    }, 600); // 0.6 seconds delay
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
      const eventText = getTimelineEventText(evt.action, evt.team, evt.event_id);
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
      }, 600); // Another 0.6s delay

    }, 600); // Initial 0.6s delay
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

  // 🎯 Generate varied timeline event texts
  const getVariedTimelineEventText = (action: number, team: number, eventId?: number): string => {
    // Create a deterministic seed based on action, team, and optional eventId
    // This ensures same text for same event, but different texts for different events
    const baseSeed = action * 100 + team * 10;
    const finalSeed = eventId !== undefined ? baseSeed + eventId : baseSeed + currentMinute;
    const variation = finalSeed % 4; // Get 0, 1, 2, or 3

    // Team 0 = Your team, Team 1 = Opponent team, Team 2 = Neutral
    const teamName = team === 0 ? "Your team" : team === 1 ? "The opponent" : "Both teams";

    switch (action) {
      case 0: // OPENPLAY
        if (team === 0) { // Your team
          const texts = [
            "Your team controls the ball in midfield, looking for an opening",
            "Brilliant passing sequence by your players creates space",
            "Your striker makes a clever run behind the defense",
            "Your team builds up play patiently from the back"
          ];
          return texts[variation];
        } else if (team === 1) { // Opponent team
          const texts = [
            "The opponent has the ball near the penalty area",
            "No one can stop the rival star, they have a clear shot at goal",
            "Dangerous attack developing from the opponent's left wing",
            "The opposing midfielder threads a perfect through ball"
          ];
          return texts[variation];
        } else { // Neutral
          const texts = [
            "Open play continues with both teams fighting for control",
            "The ball moves from end to end in exciting fashion",
            "Neither team can establish clear dominance",
            "Fast-paced action with chances at both ends"
          ];
          return texts[variation];
        }

      case 1: // JUMPER
        if (team === 0) {
          const texts = [
            "Your player wins a crucial header in the box",
            "Excellent aerial ability displayed by your defender",
            "Your striker outjumps the keeper for the ball",
            "Perfect timing on the jump gives your team possession"
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent's tall striker dominates in the air",
            "Their center-back wins every aerial duel",
            "Opposition player leaps highest to claim the ball",
            "The rival's goalkeeper punches clear under pressure"
          ];
          return texts[variation];
        } else {
          const texts = [
            "Players from both teams compete fiercely for the high ball",
            "A crowded penalty box sees multiple players jumping",
            "Aerial battle in midfield with no clear winner",
            "The ball bounces around after a contested header"
          ];
          return texts[variation];
        }

      case 2: // BRAWL
        const texts = [
          "Tempers flare as players from both sides clash",
          "The referee steps in to separate arguing players",
          "A heated exchange breaks out near the touchline",
          "Players need to be pulled apart after a hard tackle"
        ];
        return texts[variation];

      case 3: // FREEKICK
        if (team === 0) {
          const texts = [
            "Your team earns a dangerous free kick in a promising position",
            "Excellent opportunity from the free kick for your side",
            "Your players line up for what could be a crucial set piece",
            "The referee awards your team a free kick after a foul"
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent gets a free kick in a threatening area",
            "Dangerous set piece opportunity for the opposing team",
            "Their free kick specialist steps up to take the shot",
            "The rival team has a chance to score from this free kick"
          ];
          return texts[variation];
        } else {
          const texts = [
            "Free kick awarded after a controversial decision",
            "The referee points to the spot for a free kick",
            "Set piece situation developing in a key area",
            "Players position themselves for the upcoming free kick"
          ];
          return texts[variation];
        }

      case 4: // PENALTY
        if (team === 0) {
          const texts = [
            "PENALTY! Your team has been awarded a spot kick!",
            "The referee points to the spot - huge chance for your team!",
            "Penalty awarded after a clear foul in the box!",
            "Your striker was brought down - it's a penalty!"
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "PENALTY to the opponent! This could be dangerous!",
            "The opposition has been given a penalty kick!",
            "Spot kick awarded to the rival team after a foul",
            "The opponent's striker was fouled - penalty given!"
          ];
          return texts[variation];
        } else {
          const texts = [
            "Penalty situation under review by the referee",
            "Controversial penalty decision being made",
            "The referee consults before awarding the penalty",
            "Penalty kick awarded after careful consideration"
          ];
          return texts[variation];
        }

      case 5: // OPENDEFENSE
        if (team === 0) {
          const texts = [
            "Solid defensive work by your backline stops the attack",
            "Your goalkeeper makes a crucial save to keep it level",
            "Excellent tackle by your defender breaks up the play",
            "Your team's defensive organization frustrates the opponent"
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent's defense stands firm under pressure",
            "Their goalkeeper pulls off a spectacular save",
            "Resolute defending from the opposing team",
            "The rival's backline clears the danger effectively"
          ];
          return texts[variation];
        } else {
          const texts = [
            "Defensive play dominates as both teams stay compact",
            "Neither attack can break through the organized defenses",
            "Solid defending from both sides keeps the score level",
            "The defensive phase of play sees few clear chances"
          ];
          return texts[variation];
        }

      case 6: // HALFTIME
        const halftimeTexts = [
          "🕐 HALF TIME - Players head to the dressing rooms",
          "🕐 The referee blows for half time - time for a break",
          "🕐 HALF TIME - Coaches prepare their tactical talks",
          "🕐 The first half comes to an end - players rest up"
        ];
        return halftimeTexts[variation];

      case 7: // MATCHEND
        const endTexts = [
          "⏱️ FULL TIME - The final whistle blows!",
          "⏱️ MATCH FINISHED - What a game that was!",
          "⏱️ FULL TIME - The referee ends the match",
          "⏱️ THE MATCH IS OVER - Time to see the final result!"
        ];
        return endTexts[variation];

      case 8: // SUBSTITUTE
        if (team === 0) {
          const texts = [
            "Your coach makes a tactical substitution",
            "Fresh legs brought on for your team",
            "Strategic change as your team brings on a new player",
            "Your manager opts for a substitution to change the game"
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent makes a substitution to strengthen their team",
            "Fresh player comes on for the opposing side",
            "The rival coach makes a tactical change",
            "Opposition brings on a substitute to alter their approach"
          ];
          return texts[variation];
        } else {
          const texts = [
            "Substitution made as coaches look to impact the game",
            "Player change occurs with tactical intentions",
            "Fresh legs introduced to change the dynamic",
            "Strategic substitution made by the coaching staff"
          ];
          return texts[variation];
        }

      default:
        return `${teamName} action occurs`;
    }
  };

  const getTimelineEventText = (action: number, team: number, eventId?: number): string => {
    return getVariedTimelineEventText(action, team, eventId);
  };

  // 🎯 Auto-scroll events
  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
    }
  }, [displayedEvents]);

  // 🎯 Cleanup
  useEffect(() => {
    // Cleanup function that runs when component unmounts OR when matchId changes
    return () => {
      console.log("🧹 === COMPONENT CLEANUP ===");
      if (timerRef.current) {
        console.log("🧹 Clearing timer on cleanup");
        clearInterval(timerRef.current);
        timerRef.current = null;
      } else {
        console.log("🧹 No timer to clear on cleanup");
      }
    };
  }, [matchId]); // Re-run cleanup when matchId changes

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
