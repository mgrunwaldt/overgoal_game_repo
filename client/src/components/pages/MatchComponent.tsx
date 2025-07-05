import { useState, useEffect, useRef } from "react";
import MatchEventIten from "../ui/matchEventIten";
import StaminaBar from "../ui/StaminaBar";
import MatchDecision from "./MatchDecision";
import { useNavigate, useParams } from "react-router-dom";
import useAppStore from "../../zustand/store";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useProcessMatchAction } from "../../dojo/hooks/useProcessMatchAction";
import { useGameMatch } from "../../dojo/hooks/useGameMatch";
import { MatchTimelineEvent } from "../../dojo/hooks/types";

type MatchActionType =
  | "OpenPlay"
  | "Freekick"
  | "Penalty"
  | "Defense Open Play"
  | "Jumper"
  | "brawl";

interface UIMatchEvent {
  text: string;
  playable: boolean;
  team: "player" | "enemy" | "neutral";
}

const MatchComponent = () => {
  // 🎯 STATIC TIMING CONFIGURATION - EASILY MODIFIABLE
  const TIMER_TICK_INTERVAL_MS = 250; // Time between timer ticks when no events (0.3s)
  const EVENT_PROCESSING_DELAY_MS = 1000; // Time delay when processing events with animations (3s for debugging)
  const SCORE_BLINKING_DURATION_MS = 1000; // Duration of score blinking animation after goals

  const navigate = useNavigate();
  const { matchId } = useParams();
  const { matchTimelineEvents } = useAppStore();
  const { player } = usePlayer();
  const {
    execute: processNextAction,
    choseAction,
    state: processState,
  } = useProcessMatchAction();
  const { getGameMatch, handleProcessMatchAction } = useGameMatch(
    matchId ? parseInt(matchId) : 0
  );

  // 🎯 SIMPLE STATE STRUCTURE - TIMELINE-DRIVEN APPROACH
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [allTimelineEvents, setAllTimelineEvents] = useState<
    MatchTimelineEvent[]
  >([]);
  const [processedEventIds, setProcessedEventIds] = useState<Set<number>>(
    new Set()
  );
  const [displayedEvents, setDisplayedEvents] = useState<UIMatchEvent[]>([]);
  // 🎯 LOCAL SCORE VARIABLES - NEVER RESET
  const [localScore, setLocalScore] = useState({ myTeam: 0, opponent: 0 });
  const [isWaitingForUserAction, setIsWaitingForUserAction] = useState(false);
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);
  const [isDecisionOpen, setDecisionOpen] = useState(false);
  const [isScoreBlinking, setIsScoreBlinking] = useState(false);
  // 🎯 ACTION RESULT STATE
  const [isShowingActionResult, setIsShowingActionResult] = useState(false);
  const [isLoadingActionResult, setIsLoadingActionResult] = useState(false);
  const [actionResultText, setActionResultText] = useState<string>("");
  const [isChainedActionResult, setIsChainedActionResult] = useState(false);
  const [storedResultText, setStoredResultText] = useState<string>(""); // Store result text for timeline display
  const [pendingUserActionEvent, setPendingUserActionEvent] =
    useState<MatchTimelineEvent | null>(null);
  // 🎯 NEW: Store timeline events for decision minute in correct order
  const [decisionMinuteEvents, setDecisionMinuteEvents] = useState<
    MatchTimelineEvent[]
  >([]);
  const [decisionMinute, setDecisionMinute] = useState<number | null>(null);
  // 🎯 NEW: Store actual UI text from modal for decision minute
  const [decisionMinuteUITexts, setDecisionMinuteUITexts] = useState<string[]>(
    []
  );
  // 🎯 MATCH CONTINUATION STATE (for half_time and match_end events)
  const [isWaitingForMatchContinuation, setIsWaitingForMatchContinuation] =
    useState(false);
  const [isProcessingMatchContinuation, setIsProcessingMatchContinuation] =
    useState(false);
  const [pendingMatchEvent, setPendingMatchEvent] =
    useState<MatchTimelineEvent | null>(null);

  // 🎯 SIMPLE REFS
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const currentMinuteRef = useRef<number>(0);
  const initializedTimelineEventsRef = useRef<string>(""); // Track which timeline events we've initialized with

  const stamina = player?.stamina || 100;

  // 🎯 GET PLAYER TYPE FOR IMAGES - same logic as NewMatch.tsx
  const getPlayerTypeString = (playerType: any): string => {
    // Convert enum to string (returns "Striker", "Dribbler", "Playmaker")
    const enumString = playerType.toString();
    // Convert to lowercase for image paths
    return enumString.toLowerCase();
  };

  // 🎯 MAP ACTION NUMBERS TO ACTION TYPES
  const getMatchActionType = (actionNumber: number): MatchActionType => {
    switch (actionNumber) {
      case 0: // OPENPLAY
        return "OpenPlay";
      case 1: // JUMPER
        return "Jumper";
      case 2: // BRAWL
        return "brawl";
      case 3: // FREEKICK
        return "Freekick";
      case 4: // PENALTY
        return "Penalty";
      case 5: // OPENDEFENSE
        return "Defense Open Play";
      default:
        return "OpenPlay"; // fallback
    }
  };

  // 🎯 MAP DECISION INDEX TO MATCH DECISION ENUM
  const mapDecisionToEnum = (
    actionType: MatchActionType,
    decisionIndex: number,
    teamNumber: number
  ): number => {
    switch (actionType) {
      case "OpenPlay":
        // If opponent team (teamNumber = 1), use defensive options
        if (teamNumber === 1) {
          // ['Standing tackle', 'Sweeping tackle'] → [4, 5]
          const defenseMap = [4, 5]; // StandingTackle, SweepingTackle
          return decisionIndex < defenseMap.length
            ? defenseMap[decisionIndex]
            : 4;
        }
        // If your team (teamNumber = 0), use offensive options
        // ['Pass', 'Dribble', 'Shoot', 'Simulate foul'] → [1, 0, 3, 2]
        const openPlayMap = [1, 0, 3, 2]; // Pass, Dribble, Shoot, Simulate
        return decisionIndex < openPlayMap.length
          ? openPlayMap[decisionIndex]
          : 1;

      case "Freekick":
        // ['Cross', 'Shoot'] → [14, 13] (FreekickCross, FreekickShoot)
        const freekickMap = [14, 13]; // FreekickCross, FreekickShoot
        return decisionIndex < freekickMap.length
          ? freekickMap[decisionIndex]
          : 13; // Default to FreekickShoot

      case "Penalty":
        // ['Shoot at center', 'Shoot at corner', 'Panenka penalty'] → [11, 10, 12]
        const penaltyMap = [11, 10, 12]; // CenterPenalty, CornerPenalty, PanenkaPenalty
        return decisionIndex < penaltyMap.length
          ? penaltyMap[decisionIndex]
          : 11; // Default to CenterPenalty

      case "Defense Open Play":
        // ['Standing tackle', 'Sweeping tackle'] → [4, 5]
        const defenseMap = [4, 5]; // StandingTackle, SweepingTackle
        return decisionIndex < defenseMap.length
          ? defenseMap[decisionIndex]
          : 4;

      case "Jumper":
        // ['Accept hug', 'Tackle fan'] → [6, 7]
        const jumperMap = [6, 7]; // AcceptHug, TackleFan
        return decisionIndex < jumperMap.length ? jumperMap[decisionIndex] : 6;

      case "brawl":
        // ['Join brawl', 'Stay out'] → [8, 9]
        const brawlMap = [8, 9]; // JoinBrawl, StayOut
        return decisionIndex < brawlMap.length ? brawlMap[decisionIndex] : 8;

      default:
        return 1; // Default to Pass
    }
  };

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

  // 🎯 STEP 1: Initialize with timeline events from backend
  useEffect(() => {
    console.log("🔄 === INITIALIZING TIMELINE-DRIVEN MATCH ===");
    console.log("📊 Current state:", {
      matchId,
      isShowingActionResult,
      timelineEventsCount: matchTimelineEvents?.length || 0,
      timelineEvents: matchTimelineEvents,
    });

    if (!matchId) {
      console.log("❌ No matchId provided");
      return;
    }

    // 🎯 Don't auto-restart timer if showing action results, loading, waiting for user action, or waiting for match continuation
    if (
      isShowingActionResult ||
      isLoadingActionResult ||
      isWaitingForUserAction ||
      isWaitingForMatchContinuation ||
      isProcessingMatchContinuation
    ) {
      console.log(
        "⏸️ Not initializing - showing action results, loading, waiting for user action, or waiting/processing match continuation"
      );
      return;
    }

    // 🎯 NEW FIX: Check if we already have timeline events
    if (matchTimelineEvents && matchTimelineEvents.length > 0) {
      // Create a unique identifier for these timeline events
      const timelineEventsKey = `${matchId}-${
        matchTimelineEvents.length
      }-${matchTimelineEvents.map((e) => e.event_id).join(",")}`;

      // 🎯 FIX: When returning from user action or match continuation, always restart timer even with same events
      const isReturningFromAction =
        !isShowingActionResult &&
        !isLoadingActionResult &&
        !isWaitingForMatchContinuation &&
        !isProcessingMatchContinuation &&
        initializedTimelineEventsRef.current === timelineEventsKey;

      // Check if we've already initialized with these exact timeline events (unless returning from action)
      if (
        initializedTimelineEventsRef.current === timelineEventsKey &&
        !isReturningFromAction
      ) {
        console.log(
          "⏭️ Already initialized with these timeline events, skipping..."
        );
        return;
      }

      if (isReturningFromAction) {
        console.log(
          "🔄 Returning from action - restarting timer with existing timeline events"
        );
      } else {
        console.log(
          "✅ Timeline events available, initializing for the first time with key:",
          timelineEventsKey
        );
        initializedTimelineEventsRef.current = timelineEventsKey;
      }

      // Clear any existing timer before starting fresh
      if (timerRef.current) {
        console.log("🧹 Clearing existing timer before fresh start");
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Sort timeline events by event_id ONLY
      const sortedEvents = [...matchTimelineEvents].sort(
        (a, b) => a.event_id - b.event_id
      );

      console.log("📊 Sorted timeline events:", sortedEvents.length);
      console.log(
        "📋 Timeline events order check:",
        sortedEvents.map((e) => `${e.minute}'[${e.event_id}]`).join(" → ")
      );

      // 🎯 FIX: Verify sorting is correct
      for (let i = 1; i < sortedEvents.length; i++) {
        if (sortedEvents[i].minute < sortedEvents[i - 1].minute) {
          console.error("❌ SORTING ERROR: Event order is incorrect!", {
            previous: `${sortedEvents[i - 1].minute}'[${
              sortedEvents[i - 1].event_id
            }]`,
            current: `${sortedEvents[i].minute}'[${sortedEvents[i].event_id}]`,
          });
        }
      }

      setAllTimelineEvents(sortedEvents);

      // 🎯 FIX: Only reset state if NOT returning from action
      if (!isReturningFromAction) {
        console.log("🔄 Fresh start - resetting all state");
        setCurrentMinute(0);
        setLocalScore({ myTeam: 0, opponent: 0 });
        setProcessedEventIds(new Set());
        setDisplayedEvents([]);
        setIsWaitingForUserAction(false);
        setIsWaitingForMatchContinuation(false);
        setIsProcessingMatchContinuation(false);
        setIsProcessingEvent(false);
      } else {
        console.log("🔄 Returning from action - preserving timeline state");
        // Only reset action-specific states
        setIsWaitingForUserAction(false);
        setIsWaitingForMatchContinuation(false);
        setIsProcessingMatchContinuation(false);
        setIsProcessingEvent(false);

        // 🎯 NOTE: Timer will automatically use the updated allTimelineEvents state
        console.log(
          "📊 Updated timeline events available for timer:",
          sortedEvents.length
        );
      }

      // Start the timeline-driven timer
      if (isReturningFromAction) {
        console.log(
          "🎬 Restarting timeline-driven timer from current minute..."
        );
        startTimelineDrivenTimer(sortedEvents, currentMinute);
      } else {
        console.log(
          "🎬 Starting timeline-driven timer with existing events..."
        );
        startTimelineDrivenTimer(sortedEvents);
      }
      return;
    }

    // 🎯 If no timeline events yet, fetch them
    const initializeMatch = async () => {
      try {
        console.log("🌐 No timeline events yet, fetching from backend...");
        await getGameMatch();
        console.log("✅ getGameMatch() completed");

        // Note: The useEffect will re-run when matchTimelineEvents gets populated
        // due to the dependency array, so we don't need to check again here
      } catch (error) {
        console.error("❌ Failed to fetch initial timeline events:", error);
      }
    };

    initializeMatch();

    // Cleanup timer on unmount or matchId change
    return () => {
      console.log("🧹 Cleaning up timeline timer");
      if (timerRef.current) {
        console.log("🧹 Clearing timer on cleanup");
        clearInterval(timerRef.current);
        timerRef.current = null;
      } else {
        console.log("🧹 No timer to clear on cleanup");
      }
      // Reset initialization tracking when component unmounts or matchId changes
      console.log("🧹 Resetting initialization tracking");
      initializedTimelineEventsRef.current = "";
    };
  }, [
    matchId,
    isShowingActionResult,
    isLoadingActionResult,
    isWaitingForUserAction,
    isWaitingForMatchContinuation,
    isProcessingMatchContinuation,
    matchTimelineEvents,
  ]); // 🎯 FIX: Added matchTimelineEvents, user action, and match continuation dependencies

  // 🎯 STEP 2: Timeline-driven timer function
  const startTimelineDrivenTimer = (
    timelineEvents: MatchTimelineEvent[],
    startingMinute?: number
  ) => {
    console.log("🎬 === STARTING TIMELINE-DRIVEN TIMER ===");
    console.log(
      "📊 Timer will process",
      timelineEvents.length,
      "total timeline events"
    );
    console.log(
      "📋 Timeline events:",
      timelineEvents.map((e) => ({
        id: e.event_id,
        minute: e.minute,
        action: e.action,
        team: e.team,
        scored: e.team_scored || e.opponent_team_scored,
      }))
    );

    // Clear any existing timer
    if (timerRef.current) {
      console.log("⏹️ Clearing existing timer");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Log events that require user action using the backend field
    const userActionEvents = timelineEvents.filter((evt) =>
      Boolean(evt.player_participates)
    );
    console.log("📋 User action events found:", userActionEvents.length);
    console.log(
      "🎮 User action events:",
      userActionEvents.map((e) => ({
        id: e.event_id,
        minute: e.minute,
        action: e.action,
        player_participates: e.player_participates,
      }))
    );

    // Log timeline events with player participation
    console.log(
      "📋 Timeline events with player_participates field:",
      timelineEvents.map((e) => ({
        event_id: e.event_id,
        minute: e.minute,
        action: e.action,
        team: e.team,
        player_participates: e.player_participates,
      }))
    );

    // 🎯 FIX: Start from provided minute or 0 for fresh start
    const initialMinute = startingMinute ?? 0;
    currentMinuteRef.current = initialMinute;
    console.log(`⏰ Timer starting from minute ${initialMinute}`);

    // 🎯 FIX: When restarting, preserve existing processed event IDs
    let processedIds = startingMinute ? processedEventIds : new Set<number>();
    console.log(
      `📊 Starting with ${processedIds.size} already processed events`
    );
    if (processedIds.size > 0) {
      console.log(`📊 Already processed event IDs:`, Array.from(processedIds));
    }

    console.log("⏰ Creating interval timer with 300ms ticks...");
    timerRef.current = setInterval(() => {
      console.log("⏰ Timeline timer tick");

      // Don't tick if processing any event
      if (isProcessingEvent) {
        console.log("⏸️ Skipping tick - processing event");
        return;
      }

      currentMinuteRef.current += 1;
      const newMinute = currentMinuteRef.current;
      console.log(
        `⏰ Internal timer advancing to minute ${newMinute} (display timer will update after events)`
      );

      // 🎯 FIX: Don't update display timer yet - only after events are processed

      // 🎯 FIX: Use current allTimelineEvents state instead of snapshot
      const currentTimelineEvents =
        allTimelineEvents.length > 0 ? allTimelineEvents : timelineEvents;

      // Find events for this minute
      const eventsThisMinute = currentTimelineEvents.filter(
        (evt) => evt.minute === newMinute && !processedIds.has(evt.event_id)
      );

      if (eventsThisMinute.length > 0) {
        console.log(
          `📝 Found ${eventsThisMinute.length} events for minute ${newMinute}:`,
          eventsThisMinute.map((e) => `[${e.event_id}]${e.action}`)
        );
        console.log(
          `📊 Already processed event IDs:`,
          Array.from(processedIds)
        );
        console.log(
          `📊 Available timeline events minutes:`,
          currentTimelineEvents.map((e) => e.minute).sort((a, b) => a - b)
        );
        console.log(
          `📊 Using ${currentTimelineEvents.length} total timeline events (${
            timelineEvents.length
          } original + ${Math.max(
            0,
            currentTimelineEvents.length - timelineEvents.length
          )} new)`
        );

        // Check if any events require user action
        const requiresUserAction = eventsThisMinute.some((evt) =>
          Boolean(evt.player_participates)
        );
        console.log(
          `🎮 User action required for minute ${newMinute}: ${requiresUserAction}`
        );

        // 🎯 NEW: Check if any events require match continuation (half_time or match_end)
        const requiresMatchContinuation = eventsThisMinute.some(
          (evt) => Boolean(evt.half_time) || Boolean(evt.match_end)
        );
        console.log(
          `⏰ Match continuation required for minute ${newMinute}: ${requiresMatchContinuation}`
        );

        if (requiresUserAction) {
          console.log("🎮 User action required - stopping timer");
          const userEvent = eventsThisMinute.find((evt) =>
            Boolean(evt.player_participates)
          );
          if (userEvent) {
            console.log("🎮 Setting pending user action event:", userEvent);
            setPendingUserActionEvent(userEvent);
            setIsWaitingForUserAction(true);

            // 🎯 FIX: Update display timer when user action starts
            console.log(
              `🕐 Display timer updating to ${newMinute}' for user action`
            );
            setCurrentMinute(newMinute);

            // Add interactive event to timeline
            const interactiveEvent: UIMatchEvent = {
              text: `${userEvent.minute}' - ${getEventDisplayText(
                userEvent
              )} - YOUR TURN!`,
              playable: true,
              team:
                userEvent.team === 0
                  ? "player"
                  : userEvent.team === 1
                  ? "enemy"
                  : "neutral",
            };
            setDisplayedEvents((prev) => [...prev, interactiveEvent]);

            // Stop timer until user acts
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            console.log("⏹️ Timer stopped for user action");
            return;
          }
        } else if (requiresMatchContinuation) {
          console.log("⏰ Match continuation required - stopping timer");
          const matchEvent = eventsThisMinute.find(
            (evt) => Boolean(evt.half_time) || Boolean(evt.match_end)
          );
          if (matchEvent) {
            console.log(
              "⏰ Setting pending match continuation event:",
              matchEvent
            );
            setPendingMatchEvent(matchEvent);
            setIsWaitingForMatchContinuation(true);

            // 🎯 Update display timer when match continuation starts
            console.log(
              `🕐 Display timer updating to ${newMinute}' for match continuation`
            );
            setCurrentMinute(newMinute);

            // Add match continuation event to timeline (non-playable)
            const continuationText = matchEvent.half_time
              ? "HALF TIME - Match Paused"
              : "FULL TIME - Match Ended";
            const continuationEvent: UIMatchEvent = {
              text: `${matchEvent.minute}' - ${continuationText}`,
              playable: false, // 🎯 No play button for these events
              team: "neutral",
            };
            setDisplayedEvents((prev) => [...prev, continuationEvent]);

            // Stop timer until user continues
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            console.log("⏹️ Timer stopped for match continuation");
            return;
          }
        } else {
          // Process non-interactive events
          console.log(
            "⚽ Processing non-interactive events for minute",
            newMinute
          );

          // 🎯 STOP TIMER while processing events (just like user actions)
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          console.log("⏹️ Timer stopped for event processing");

          // 🎯 Set processing state for the entire minute
          setIsProcessingEvent(true);

          // 🎯 FIX: Sort events within the minute by event_id to ensure consistent order
          const sortedEventsThisMinute = eventsThisMinute.sort(
            (a, b) => a.event_id - b.event_id
          );
          console.log(
            "📋 Events for minute sorted by event_id:",
            sortedEventsThisMinute.map((e) => ({
              id: e.event_id,
              minute: e.minute,
              action: e.action,
            }))
          );

          // 🎯 FIX: Process events sequentially within the minute, not in parallel
          let eventIndex = 0;
          const processNextEvent = () => {
            if (eventIndex >= sortedEventsThisMinute.length) {
              console.log(`✅ All events for minute ${newMinute} processed`);
              // 🎯 FIX: Update display timer ONLY after all events are processed
              console.log(
                `🕐 Display timer updating to ${newMinute}' after events completed`
              );
              setCurrentMinute(newMinute);
              // Only clear processing state when ALL events for this minute are done
              setIsProcessingEvent(false);

              // 🎯 RESTART TIMER after all events are processed
              console.log(
                "🎬 Restarting timer after event processing completed"
              );
              startTimelineDrivenTimer(currentTimelineEvents, newMinute);
              return;
            }

            const evt = sortedEventsThisMinute[eventIndex];
            console.log(
              `📝 Processing event ${eventIndex + 1}/${
                sortedEventsThisMinute.length
              }: ${evt.event_id}`
            );

            if (evt.team_scored || evt.opponent_team_scored) {
              console.log("🥅 Goal event detected");
              processGoalEvent(evt, () => {
                processedIds.add(evt.event_id);
                eventIndex++;
                processNextEvent(); // Process next event after this one completes
              });
            } else {
              console.log("⚽ Regular event detected");
              processRegularEvent(evt, () => {
                processedIds.add(evt.event_id);
                eventIndex++;
                processNextEvent(); // Process next event after this one completes
              });
            }
          };

          // Start processing events sequentially
          processNextEvent();
          setProcessedEventIds(new Set(processedIds));
        }
      } else {
        // 🎯 FIX: No events for this minute - update display timer immediately
        setCurrentMinute(newMinute);
      }

      // Check if match is finished (minute 90 or beyond)
      if (newMinute >= 90) {
        console.log("🏁 Match finished - stopping timer");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
    }, TIMER_TICK_INTERVAL_MS); // Timer tick interval (configurable)

    console.log("✅ Timeline timer started successfully!");
    console.log("🔍 Timer ref:", timerRef.current);
  };

  // 🎯 Process regular events - DISPLAY FIRST, THEN WAIT
  const processRegularEvent = (
    evt: MatchTimelineEvent,
    callback: () => void
  ) => {
    console.log(`⚽ Processing regular event ${evt.event_id}`);
    // 🎯 STEP 1: Display event IMMEDIATELY
    console.log(`📺 Displaying regular event ${evt.event_id}`);
    const eventText = getEventDisplayText(evt);
    const uiEvent: UIMatchEvent = {
      text: `${evt.minute}' - ${eventText}`,
      playable: false,
      team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral",
    };
    setDisplayedEvents((prev) => {
      // Filter all events for this minute, add the new one, then sort by event_id
      const eventsThisMinute = [
        ...prev.filter((e) => !e.text.startsWith(`${evt.minute}'`)),
        uiEvent,
      ];
      // Find all events for this minute in allTimelineEvents, sort by event_id
      const allEventsThisMinute = allTimelineEvents
        .filter((e) => e.minute === evt.minute)
        .sort((a, b) => a.event_id - b.event_id)
        .map((e) => ({
          text: `${e.minute}' - ${getEventDisplayText(e)}`,
          playable: false,
          team:
            e.team === 0
              ? ("player" as const)
              : e.team === 1
              ? ("enemy" as const)
              : ("neutral" as const),
        }));
      // Remove any previous events for this minute from prev, then append sorted events for this minute
      const prevWithoutThisMinute = prev.filter(
        (e) => !e.text.startsWith(`${evt.minute}'`)
      );
      return [...prevWithoutThisMinute, ...allEventsThisMinute];
    });
    // 🎯 STEP 2: Wait configured delay, THEN continue
    setTimeout(() => {
      console.log(`✅ Regular event ${evt.event_id} delay completed`);
      callback();
    }, EVENT_PROCESSING_DELAY_MS); // Event processing delay (configurable)
  };

  // 🎯 Process goal events - DISPLAY FIRST, THEN WAIT (for both parts)
  const processGoalEvent = (evt: MatchTimelineEvent, callback: () => void) => {
    console.log(`🥅 === PROCESSING GOAL EVENT ${evt.event_id} ===`);
    // 🎯 STEP 1: Display regular event IMMEDIATELY
    console.log(
      `📺 Step 1: Displaying regular part of goal event ${evt.event_id}`
    );
    const eventText = getEventDisplayText(evt);
    const regularEvent: UIMatchEvent = {
      text: `${evt.minute}' - ${eventText}`,
      playable: false,
      team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral",
    };
    setDisplayedEvents((prev) => {
      // Filter all events for this minute, add the new one, then sort by event_id
      const allEventsThisMinute = allTimelineEvents
        .filter((e) => e.minute === evt.minute)
        .sort((a, b) => a.event_id - b.event_id)
        .map((e) => ({
          text: `${e.minute}' - ${getEventDisplayText(e)}`,
          playable: false,
          team:
            e.team === 0
              ? ("player" as const)
              : e.team === 1
              ? ("enemy" as const)
              : ("neutral" as const),
        }));
      const prevWithoutThisMinute = prev.filter(
        (e) => !e.text.startsWith(`${evt.minute}'`)
      );
      return [...prevWithoutThisMinute, ...allEventsThisMinute];
    });
    // 🎯 STEP 2: Wait configured delay, THEN show goal celebration
    setTimeout(() => {
      console.log(`🎉 Step 2: Displaying GOAL part of event ${evt.event_id}`);
      const goalEvent: UIMatchEvent = {
        text: `${evt.minute}' - 🎉⚽ GOOOOOAL! ${
          evt.team_scored ? "🔥 YOUR TEAM SCORES! 🔥" : "💀 OPPONENT SCORES! 💀"
        } ⚽🎉`,
        playable: false,
        team: evt.team === 0 ? "player" : evt.team === 1 ? "enemy" : "neutral",
      };
      setDisplayedEvents((prev) => [...prev, goalEvent]);
      // Update local score progressively
      console.log("📊 Updating local score progressively...");
      if (evt.team_scored) {
        console.log("🥅 MY TEAM SCORED!");
        setLocalScore((prev) => {
          const newScore = { ...prev, myTeam: prev.myTeam + 1 };
          console.log(
            `📊 Score updated: ${newScore.myTeam}-${newScore.opponent}`
          );
          return newScore;
        });
      }
      if (evt.opponent_team_scored) {
        console.log("🥅 OPPONENT SCORED!");
        setLocalScore((prev) => {
          const newScore = { ...prev, opponent: prev.opponent + 1 };
          console.log(
            `📊 Score updated: ${newScore.myTeam}-${newScore.opponent}`
          );
          return newScore;
        });
      }

      // Trigger score blinking
      console.log("✨ Triggering score blinking");
      triggerScoreBlinking();

      // 🎯 STEP 3: Wait configured delay, THEN continue
      setTimeout(() => {
        console.log(`✅ === GOAL EVENT ${evt.event_id} COMPLETE ===`);
        callback();
      }, EVENT_PROCESSING_DELAY_MS); // Goal celebration delay (configurable)
    }, EVENT_PROCESSING_DELAY_MS); // Regular event delay (configurable)
  };

  // 🎯 Helper functions
  const triggerScoreBlinking = () => {
    console.log("✨ Score blinking triggered");
    setIsScoreBlinking(true);
    setTimeout(() => {
      console.log("✨ Score blinking ended");
      setIsScoreBlinking(false);
    }, SCORE_BLINKING_DURATION_MS);
  };

  // 🎯 Generate varied timeline event texts
  const getVariedTimelineEventText = (
    action: number,
    team: number,
    eventId?: number
  ): string => {
    // Create a deterministic seed based on action, team, and optional eventId
    // This ensures same text for same event, but different texts for different events
    const baseSeed = action * 100 + team * 10;
    const finalSeed =
      eventId !== undefined ? baseSeed + eventId : baseSeed + currentMinute;
    const variation = finalSeed % 4; // Get 0, 1, 2, or 3

    // Team 0 = Your team, Team 1 = Opponent team, Team 2 = Neutral
    const teamName =
      team === 0 ? "Your team" : team === 1 ? "The opponent" : "Both teams";

    switch (action) {
      case 0: // OPENPLAY
        if (team === 0) {
          // Your team
          const texts = [
            "Your team controls the ball in midfield, looking for an opening",
            "Brilliant passing sequence by your players creates space",
            "Your striker makes a clever run behind the defense",
            "Your team builds up play patiently from the back",
          ];
          return texts[variation];
        } else if (team === 1) {
          // Opponent team
          const texts = [
            "The opponent has the ball near the penalty area",
            "No one can stop the rival star, they have a clear shot at goal",
            "Dangerous attack developing from the opponent's left wing",
            "The opposing midfielder threads a perfect through ball",
          ];
          return texts[variation];
        } else {
          // Neutral
          const texts = [
            "Open play continues with both teams fighting for control",
            "The ball moves from end to end in exciting fashion",
            "Neither team can establish clear dominance",
            "Fast-paced action with chances at both ends",
          ];
          return texts[variation];
        }

      case 1: // JUMPER
        if (team === 0) {
          const texts = [
            "Your player wins a crucial header in the box",
            "Excellent aerial ability displayed by your defender",
            "Your striker outjumps the keeper for the ball",
            "Perfect timing on the jump gives your team possession",
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent's tall striker dominates in the air",
            "Their center-back wins every aerial duel",
            "Opposition player leaps highest to claim the ball",
            "The rival's goalkeeper punches clear under pressure",
          ];
          return texts[variation];
        } else {
          const texts = [
            "Players from both teams compete fiercely for the high ball",
            "A crowded penalty box sees multiple players jumping",
            "Aerial battle in midfield with no clear winner",
            "The ball bounces around after a contested header",
          ];
          return texts[variation];
        }

      case 2: // BRAWL
        const texts = [
          "Tempers flare as players from both sides clash",
          "The referee steps in to separate arguing players",
          "A heated exchange breaks out near the touchline",
          "Players need to be pulled apart after a hard tackle",
        ];
        return texts[variation];

      case 3: // FREEKICK
        if (team === 0) {
          const texts = [
            "Your team earns a dangerous free kick in a promising position",
            "Excellent opportunity from the free kick for your side",
            "Your players line up for what could be a crucial set piece",
            "The referee awards your team a free kick after a foul",
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent gets a free kick in a threatening area",
            "Dangerous set piece opportunity for the opposing team",
            "Their free kick specialist steps up to take the shot",
            "The rival team has a chance to score from this free kick",
          ];
          return texts[variation];
        } else {
          const texts = [
            "Free kick awarded after a controversial decision",
            "The referee points to the spot for a free kick",
            "Set piece situation developing in a key area",
            "Players position themselves for the upcoming free kick",
          ];
          return texts[variation];
        }

      case 4: // PENALTY
        if (team === 0) {
          const texts = [
            "PENALTY! Your team has been awarded a spot kick!",
            "The referee points to the spot - huge chance for your team!",
            "Penalty awarded after a clear foul in the box!",
            "Your striker was brought down - it's a penalty!",
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "PENALTY to the opponent! This could be dangerous!",
            "The opposition has been given a penalty kick!",
            "Spot kick awarded to the rival team after a foul",
            "The opponent's striker was fouled - penalty given!",
          ];
          return texts[variation];
        } else {
          const texts = [
            "Penalty situation under review by the referee",
            "Controversial penalty decision being made",
            "The referee consults before awarding the penalty",
            "Penalty kick awarded after careful consideration",
          ];
          return texts[variation];
        }

      case 5: // OPENDEFENSE
        if (team === 0) {
          const texts = [
            "Solid defensive work by your backline stops the attack",
            "Your goalkeeper makes a crucial save to keep it level",
            "Excellent tackle by your defender breaks up the play",
            "Your team's defensive organization frustrates the opponent",
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent's defense stands firm under pressure",
            "Their goalkeeper pulls off a spectacular save",
            "Resolute defending from the opposing team",
            "The rival's backline clears the danger effectively",
          ];
          return texts[variation];
        } else {
          const texts = [
            "Defensive play dominates as both teams stay compact",
            "Neither attack can break through the organized defenses",
            "Solid defending from both sides keeps the score level",
            "The defensive phase of play sees few clear chances",
          ];
          return texts[variation];
        }

      case 6: // HALFTIME
        const halftimeTexts = [
          "🕐 HALF TIME - Players head to the dressing rooms",
          "🕐 The referee blows for half time - time for a break",
          "🕐 HALF TIME - Coaches prepare their tactical talks",
          "🕐 The first half comes to an end - players rest up",
        ];
        return halftimeTexts[variation];

      case 7: // MATCHEND
        const endTexts = [
          "⏱️ FULL TIME - The final whistle blows!",
          "⏱️ MATCH FINISHED - What a game that was!",
          "⏱️ FULL TIME - The referee ends the match",
          "⏱️ THE MATCH IS OVER - Time to see the final result!",
        ];
        return endTexts[variation];

      case 8: // SUBSTITUTE
        if (team === 0) {
          const texts = [
            "Your coach makes a tactical substitution",
            "Fresh legs brought on for your team",
            "Strategic change as your team brings on a new player",
            "Your manager opts for a substitution to change the game",
          ];
          return texts[variation];
        } else if (team === 1) {
          const texts = [
            "The opponent makes a substitution to strengthen their team",
            "Fresh player comes on for the opposing side",
            "The rival coach makes a tactical change",
            "Opposition brings on a substitute to alter their approach",
          ];
          return texts[variation];
        } else {
          const texts = [
            "Substitution made as coaches look to impact the game",
            "Player change occurs with tactical intentions",
            "Fresh legs introduced to change the dynamic",
            "Strategic substitution made by the coaching staff",
          ];
          return texts[variation];
        }

      default:
        return `${teamName} action occurs`;
    }
  };

  const getTimelineEventText = (
    action: number,
    team: number,
    eventId?: number
  ): string => {
    return getVariedTimelineEventText(action, team, eventId);
  };

  // 🎯 NEW: Helper function to decode backend descriptions
  const decodeBackendDescription = (hexDescription: string): string => {
    if (hexDescription.startsWith("0x")) {
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

  // 🎯 NEW: Get event text with smart backend/frontend priority
  const getEventDisplayText = (evt: MatchTimelineEvent): string => {
    if (evt.description) {
      const decodedDescription = decodeBackendDescription(evt.description);
      if (decodedDescription && decodedDescription.trim() !== "") {
        // 🎯 FIX: Only use backend description if it's specific, not generic
        const isGenericDescription =
          decodedDescription.includes("team attacks") ||
          decodedDescription.includes("Opponent team attacks") ||
          decodedDescription.includes("Opponent attacks") ||
          decodedDescription.includes("Random event");

        if (!isGenericDescription) {
          // Use specific backend descriptions like "Dribble successful!", "Free kick situation", etc.
          return decodedDescription;
        }
      }
    }
    // Use frontend enum-based text for generic descriptions or when no backend description
    return getTimelineEventText(evt.action, evt.team, evt.event_id);
  };

  // 🎯 Auto-scroll events
  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop =
        eventContainerRef.current.scrollHeight;
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

  // 🎯 NEW: Helper function to check for chained actions
  const checkForChainedAction = (
    timelineEvents: MatchTimelineEvent[]
  ): MatchTimelineEvent | null => {
    console.log(
      "🔗 Checking for chained actions in timeline events:",
      timelineEvents.length
    );

    if (timelineEvents.length === 0 || !pendingUserActionEvent) {
      console.log("📝 No timeline events or no pending user action");
      return null;
    }

    // 🎯 STEP 1: Get events from the SAME MINUTE as the current user action
    const currentMinute = pendingUserActionEvent.minute;
    const eventsInCurrentMinute = timelineEvents.filter(
      (evt) => evt.minute === currentMinute
    );

    console.log(
      "🎯 Events in current minute",
      currentMinute,
      ":",
      eventsInCurrentMinute.length
    );

    if (eventsInCurrentMinute.length === 0) {
      console.log("📝 No events found in current minute");
      return null;
    }

    // 🎯 STEP 1: From same minute, get event with highest event_id (the final result)
    const resultEvent = eventsInCurrentMinute.reduce((prev, current) =>
      current.event_id > prev.event_id ? current : prev
    );

    console.log("🎯 Final result event (highest event_id in same minute):", {
      event_id: resultEvent.event_id,
      player_participates: resultEvent.player_participates,
      minute: resultEvent.minute,
      description: resultEvent.description,
    });

    // 🎯 STEP 3: If final result has player_participates: false, NO chained action
    if (!resultEvent.player_participates) {
      console.log(
        "📝 Final result has player_participates: false - NO chained action"
      );
      return null;
    }

    // 🎯 Only if final result has player_participates: true, check for chained action
    console.log(
      "🎯 Final result has player_participates: true - checking for chained action"
    );

    // Check if this event is different from the current pending event (indicating a new action)
    if (resultEvent.event_id !== pendingUserActionEvent.event_id) {
      console.log(
        "🔗 NEW chained action detected! Event ID:",
        resultEvent.event_id
      );
      return resultEvent;
    }

    console.log("📝 No new chained action needed");
    return null;
  };

  const handleActionSelected = async (matchDecisionEnum: number) => {
    console.log("🎮 === ACTION SELECTED ===", matchDecisionEnum);
    if (!pendingUserActionEvent || !isWaitingForUserAction) {
      console.log("❌ Cannot process action - no pending user action");
      return;
    }

    try {
      console.log("🌐 Calling backend with decision enum:", matchDecisionEnum);
      setIsWaitingForUserAction(false);

      // 🎯 Show loader instead of immediate result mode
      setIsLoadingActionResult(true);
      console.log("⏳ Set loading mode BEFORE backend call");

      // Call the backend and get ALL timeline events
      const result = await choseAction(
        parseInt(matchId!),
        matchDecisionEnum,
        pendingUserActionEvent.minute
      );

      if (result) {
        console.log("📊 Action result received:", result);

        // Merge new timeline events with existing ones (avoiding duplicates)
        const updatedEvents = [...result.allTimelineEvents].sort((a, b) => {
          if (a.minute !== b.minute) return a.minute - b.minute;
          return a.event_id - b.event_id;
        });

        console.log("📊 Updated timeline events:", updatedEvents.length);
        setAllTimelineEvents(updatedEvents);

        // 🎯 Process the user action event immediately in display
        const userActionText = `${
          pendingUserActionEvent.minute
        }' - ${getEventDisplayText(pendingUserActionEvent)} - YOU PARTICIPATED`;
        const userActionEvent: UIMatchEvent = {
          text: userActionText,
          playable: false,
          team:
            pendingUserActionEvent.team === 0
              ? "player"
              : pendingUserActionEvent.team === 1
              ? "enemy"
              : "neutral",
        };
        setDisplayedEvents((prev) => [
          ...prev.filter((e) => !e.playable),
          userActionEvent,
        ]);

        // Check for goals in the result and trigger blinking if needed
        const hasGoal = result.allTimelineEvents.some(
          (evt: MatchTimelineEvent) =>
            evt.minute === pendingUserActionEvent.minute &&
            (evt.team_scored || evt.opponent_team_scored)
        );
        if (hasGoal) {
          console.log(
            "🎉 Goal detected in action result - triggering score blinking"
          );
          triggerScoreBlinking();
        }

        // 🎯 NEW: Check for chained actions that require immediate user participation
        const chainedActionEvent = checkForChainedAction(updatedEvents);

        if (chainedActionEvent) {
          console.log("🔗 === CHAINED ACTION DETECTED ===");
          console.log("🎯 Setting up new pending action:", chainedActionEvent);

          // 🎯 STEP 1: Set up the new chained action immediately
          setPendingUserActionEvent(chainedActionEvent);
          setIsWaitingForUserAction(true);

          // 🎯 STEP 2: Show result briefly (no Continue button for chained actions)
          setActionResultText(result.resultText);
          setStoredResultText(result.resultText); // Store for timeline display
          setIsLoadingActionResult(false);
          setIsShowingActionResult(true);
          setIsChainedActionResult(true); // Mark as chained action result

          // 🎯 STEP 3: CRITICAL - DON'T restart timer for chained actions
          // Timer should stay stopped until we get player_participates: false
          if (timerRef.current) {
            console.log("⏹️ Keeping timer stopped for chained action");
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // 🎯 STEP 4: After brief delay, switch to new action (timer stays stopped)
          setTimeout(() => {
            console.log(
              "🔄 Transitioning from result to new chained action - timer stays stopped"
            );
            setIsShowingActionResult(false);
            setActionResultText("");
            setIsChainedActionResult(false); // Reset chained action flag
            // Keep storedResultText for timeline display when action completes
            // Keep isWaitingForUserAction=true and pendingUserActionEvent set
            // Timer will NOT restart because isWaitingForUserAction=true
          }, 2000);
        } else {
          console.log("📝 No chained action - showing normal result");
          // 🎯 Normal flow: Set result data and switch to result mode
          setActionResultText(result.resultText);
          setStoredResultText(result.resultText); // Store for timeline display
          setIsLoadingActionResult(false);
          setIsShowingActionResult(true);
          setIsChainedActionResult(false); // Mark as normal result (show Continue button)

          // 🎯 IMPORTANT: Stop timer explicitly when showing normal results
          if (timerRef.current) {
            console.log("⏹️ Stopping timer for normal action result display");
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          console.log(
            "🔄 Switched to result display mode with actual result - timer stopped"
          );
        }
      } else {
        console.warn("⚠️ No result data received");
        setIsLoadingActionResult(false);
        setIsShowingActionResult(false);
        setDecisionOpen(false);
      }
    } catch (error) {
      console.log("❌ Error processing action selected:", error);
      setIsLoadingActionResult(false);
      setIsWaitingForUserAction(true);
      setIsShowingActionResult(false);
      return;
    }
  };

  // 🎯 Handle match continuation (half_time/match_end)
  const handleMatchContinuation = async () => {
    console.log("⏰ === MATCH CONTINUATION ===");
    if (!pendingMatchEvent || !isWaitingForMatchContinuation) {
      console.log(
        "❌ Cannot process match continuation - no pending match event"
      );
      return;
    }

    try {
      console.log("🌐 Calling backend for match continuation");
      // 🎯 DON'T reset the waiting state until AFTER backend completes!
      setIsProcessingMatchContinuation(true);

      // 🎯 For match continuation, we use a default decision (e.g., 0)
      // The backend should handle half_time/match_end logic automatically
      const result = await choseAction(
        parseInt(matchId!),
        0,
        pendingMatchEvent.minute
      );

      if (result) {
        console.log("📊 Match continuation result received:", result);

        // Update timeline events
        const updatedEvents = [...result.allTimelineEvents].sort((a, b) => {
          if (a.minute !== b.minute) return a.minute - b.minute;
          return a.event_id - b.event_id;
        });

        console.log("📊 Updated timeline events:", updatedEvents.length);
        setAllTimelineEvents(updatedEvents);

        // 🎯 ONLY NOW reset match continuation state (after backend success)
        setIsWaitingForMatchContinuation(false);
        setIsProcessingMatchContinuation(false);

        // 🎯 CHECK IF THIS WAS A MATCH END - AUTO NAVIGATE
        if (pendingMatchEvent.match_end) {
          console.log("🏁 Match ended - auto-navigating to match end screen");
          navigate(`/match-end/${matchId}`);
          return; // Don't reset pendingMatchEvent or restart timer since we're leaving
        }

        setPendingMatchEvent(null);
        console.log(
          "🔄 Match continuation completed - timer will restart automatically"
        );
      } else {
        console.warn("⚠️ No result data received from match continuation");
        // 🎯 Reset state even if no result data
        setIsWaitingForMatchContinuation(false);
        setIsProcessingMatchContinuation(false);

        // 🎯 Even without result data, if it was match end, still navigate
        if (pendingMatchEvent.match_end) {
          console.log(
            "🏁 Match ended (no result data) - auto-navigating to match end screen"
          );
          navigate(`/match-end/${matchId}`);
          return; // Don't reset pendingMatchEvent since we're leaving
        }

        setPendingMatchEvent(null);
      }
    } catch (error) {
      console.log("❌ Error processing match continuation:", error);
      // 🎯 Keep waiting state on error so user can retry, but reset processing state
      setIsProcessingMatchContinuation(false);

      // 🎯 SPECIAL CASE: If match end failed, still try to navigate to avoid getting stuck
      if (pendingMatchEvent.match_end) {
        console.log(
          "🏁 Match end failed but navigating anyway to avoid getting stuck"
        );
        navigate(`/match-end/${matchId}`);
        return;
      }

      return;
    }
  };

  // 🎯 Handle continue from action result
  const handleContinueFromResult = () => {
    console.log("🎮 === CONTINUE FROM RESULT ===");

    // 🎯 NEW: Apply stored decision minute events to timeline
    applyStoredDecisionMinuteEvents();

    if (storedResultText && pendingUserActionEvent) {
      console.log("🎯 Adding decision result to timeline:", storedResultText);

      // 🎯 FIX: Create local processed set to avoid timing issues
      const localProcessedIds = new Set([
        ...processedEventIds,
        pendingUserActionEvent.event_id,
      ]);
      console.log(
        "✅ Marking current user action as processed:",
        pendingUserActionEvent.event_id
      );

      // 🎯 FIX: Separate result events from action events using local processed set
      const allUnprocessedEvents = allTimelineEvents.filter(
        (evt) =>
          evt.minute === pendingUserActionEvent.minute &&
          !localProcessedIds.has(evt.event_id)
      );

      // Split into result events (player_participates: false) and action events (player_participates: true)
      const resultEvents = allUnprocessedEvents.filter(
        (evt) => evt.player_participates === false
      );
      const actionEvents = allUnprocessedEvents.filter(
        (evt) => evt.player_participates === true
      );

      console.log("🔍 Unprocessed events analysis:", {
        total: allUnprocessedEvents.length,
        results: resultEvents.length,
        actions: actionEvents.length,
        resultEventIds: resultEvents.map((e) => e.event_id),
        actionEventIds: actionEvents.map((e) => e.event_id),
      });

      // Check if any result event is a goal
      const hasGoal = resultEvents.some(
        (evt) => evt.team_scored || evt.opponent_team_scored
      );

      if (hasGoal) {
        const goalEvent = resultEvents.find(
          (evt) => evt.team_scored || evt.opponent_team_scored
        );
        if (goalEvent) {
          // Add goal celebration to timeline
          const goalText = `${
            pendingUserActionEvent.minute
          }' - 🎉⚽ GOOOOOAL! ${
            goalEvent.team_scored
              ? "🔥 YOUR TEAM SCORES! 🔥"
              : "💀 OPPONENT SCORES! 💀"
          } ⚽🎉`;
          const goalUIEvent: UIMatchEvent = {
            text: goalText,
            playable: false,
            team:
              goalEvent.team === 0
                ? "player"
                : goalEvent.team === 1
                ? "enemy"
                : "neutral",
          };
          setDisplayedEvents((prev) => [...prev, goalUIEvent]);

          // Update local score immediately
          if (goalEvent.team_scored) {
            setLocalScore((prev) => ({ ...prev, myTeam: prev.myTeam + 1 }));
          }
          if (goalEvent.opponent_team_scored) {
            setLocalScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
          }

          // Trigger score blinking
          triggerScoreBlinking();
        }
      }

      // 🎯 FIX: Update processed events state with current action + result events
      const newProcessedIds = new Set([
        ...localProcessedIds,
        ...resultEvents.map((evt) => evt.event_id),
      ]);
      setProcessedEventIds(newProcessedIds);

      resultEvents.forEach((evt) => {
        console.log("✅ Marked result event as processed:", evt.event_id);
      });
      console.log("✅ Updated processed events state");

      console.log("✅ Decision result added to timeline");

      // 🎯 FIX: Check for chained action in ACTION events (not all events)
      const nextUserActionEvent = actionEvents.find(
        (evt) => evt.player_participates === true
      );

      if (nextUserActionEvent) {
        console.log("🔗 CHAINED ACTION DETECTED:", nextUserActionEvent);

        // Add the chained event to timeline
        const eventText = getEventDisplayText(nextUserActionEvent);
        const chainedUIEvent: UIMatchEvent = {
          text: `${nextUserActionEvent.minute}' - ${eventText}`,
          playable: true,
          team:
            nextUserActionEvent.team === 0
              ? "player"
              : nextUserActionEvent.team === 1
              ? "enemy"
              : "neutral",
        };
        setDisplayedEvents((prev) => [...prev, chainedUIEvent]);

        // 🎯 CRITICAL FIX: Mark chained action as processed immediately to prevent timer duplication
        setProcessedEventIds(
          (prev) => new Set([...prev, nextUserActionEvent.event_id])
        );
        console.log(
          "✅ MARKED chained action as processed to prevent duplication:",
          nextUserActionEvent.event_id
        );

        // Update pending action and wait for user input
        setPendingUserActionEvent(nextUserActionEvent);
        setIsShowingActionResult(false);
        setIsChainedActionResult(false);
        setStoredResultText("");

        console.log(
          "🎯 Chained event added to timeline, waiting for user decision"
        );
        return; // Don't resume timer yet
      }
    }

    // 🎯 No chained action - resume timer and reset states
    console.log("🎮 No chained action, resuming timer");
    setIsShowingActionResult(false);
    setIsLoadingActionResult(false);
    setActionResultText("");
    setIsChainedActionResult(false);
    setStoredResultText("");
    setPendingUserActionEvent(null);

    // Reset match continuation state if needed
    setIsWaitingForMatchContinuation(false);
    setPendingMatchEvent(null);

    // Close the decision modal
    setDecisionOpen(false);

    // 🎯 Timer will restart automatically when isShowingActionResult becomes false
    console.log(
      "🎬 Timer will restart automatically when isShowingActionResult becomes false..."
    );
  };

  // 🎯 NEW: Helper function to capture timeline events for decision minute
  const captureDecisionMinuteEvents = (minute: number) => {
    console.log("📋 Capturing timeline events for decision minute:", minute);
    const eventsForMinute = allTimelineEvents
      .filter((evt) => evt.minute === minute)
      .sort((a, b) => a.event_id - b.event_id);

    console.log(
      "📋 Events captured for minute",
      minute,
      ":",
      eventsForMinute.map((e) => ({
        event_id: e.event_id,
        action: e.action,
        description: e.description,
      }))
    );

    setDecisionMinuteEvents(eventsForMinute);
    setDecisionMinute(minute);
    // 🎯 NEW: Reset UI texts storage for this minute
    setDecisionMinuteUITexts([]);
  };

  // 🎯 NEW: Helper function to store UI text as it appears in modal
  const storeDecisionMinuteUIText = (uiText: string) => {
    console.log("📋 Storing decision minute UI text:", uiText);
    setDecisionMinuteUITexts((prev) => [...prev, uiText]);
  };

  // 🎯 NEW: Helper function to apply stored decision minute UI texts to timeline
  const applyStoredDecisionMinuteEvents = () => {
    if (decisionMinute === null || decisionMinuteUITexts.length === 0) {
      console.log("📋 No stored decision minute UI texts to apply");
      return;
    }

    console.log(
      "📋 Applying stored decision minute UI texts for minute:",
      decisionMinute
    );
    console.log("📋 Stored UI texts:", decisionMinuteUITexts);

    // Remove all existing events for the decision minute from displayedEvents
    setDisplayedEvents((prev) => {
      const eventsWithoutDecisionMinute = prev.filter(
        (e) => !e.text.startsWith(`${decisionMinute}'`)
      );

      // Convert stored UI texts to UIMatchEvent format
      const storedUIEvents = decisionMinuteUITexts.map((uiText) => ({
        text: uiText,
        playable: false,
        team:
          uiText.includes("YOUR TEAM") || uiText.includes("YOU PARTICIPATED")
            ? ("player" as const)
            : uiText.includes("OPPONENT")
            ? ("enemy" as const)
            : ("neutral" as const),
      }));

      console.log(
        "📋 Adding stored UI events from modal:",
        storedUIEvents.map((e) => e.text)
      );
      return [...eventsWithoutDecisionMinute, ...storedUIEvents];
    });

    // Clear stored data after applying
    setDecisionMinuteEvents([]);
    setDecisionMinute(null);
    setDecisionMinuteUITexts([]);
  };

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
                isScoreBlinking ? "score-blinking" : ""
              }`}
              style={{ textShadow: "0 0 10px #0ff" }}
            >
              {localScore.myTeam} - {localScore.opponent}
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
                    onPlay={() => {
                      console.log(
                        "🎮 PLAY button clicked on event:",
                        event.text
                      );
                      setDecisionOpen(true);
                    }}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isWaitingForUserAction &&
          pendingUserActionEvent &&
          currentMinute < 90 && (
            <div className="w-full flex justify-center mt-4">
              <button
                onClick={() => setDecisionOpen(true)}
                disabled={processState === "executing"}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {processState === "executing"
                  ? "Processing..."
                  : `Make Decision (${currentMinute}')`}
              </button>
            </div>
          )}

        {/* 🎯 NEW: Match Continuation Button (for half_time and match_end) */}
        {isWaitingForMatchContinuation && pendingMatchEvent && (
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={handleMatchContinuation}
              disabled={
                isProcessingMatchContinuation || processState === "executing"
              }
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors transform hover:scale-105"
            >
              {isProcessingMatchContinuation || processState === "executing"
                ? "Processing..."
                : pendingMatchEvent.match_end
                ? "Finish Match"
                : "Continue Match"}
            </button>
          </div>
        )}

        <img src="/match/Logo.png" alt="Logo" className="w-24 h-24" />

        {/* End Match Button */}
        {currentMinute >= 90 && (
          <div className="w-full flex justify-end mt-12">
            <button
              onClick={() => navigate(`/match-end/${matchId}`)}
              className="w-40 h-14 bg-contain bg-no-repeat bg-center text-white text-lg font-bold flex items-center justify-center pr-4 transition-transform transform hover:scale-105"
              style={{
                backgroundImage: "url('/nonMatchResult/Next Button.png')",
              }}
            ></button>
          </div>
        )}
      </div>

      {/* Match Decision Modal */}
      <MatchDecision
        isOpen={isDecisionOpen}
        onClose={() => {
          console.log("🎮 MatchDecision closed");
          // 🎯 NEW: Apply stored decision minute events before closing
          applyStoredDecisionMinuteEvents();
          setDecisionOpen(false);
          // Reset result state if closing unexpectedly
          if (isShowingActionResult || isLoadingActionResult) {
            setIsShowingActionResult(false);
            setIsLoadingActionResult(false);
            setActionResultText("");
            setIsChainedActionResult(false);
            setStoredResultText(""); // Reset stored result text
            setPendingUserActionEvent(null);
          }
          // Reset match continuation state if closing unexpectedly
          if (isWaitingForMatchContinuation) {
            setIsWaitingForMatchContinuation(false);
            setIsProcessingMatchContinuation(false);
            setPendingMatchEvent(null);
          }
        }}
        matchActionType={
          pendingUserActionEvent
            ? getMatchActionType(pendingUserActionEvent.action)
            : "OpenPlay"
        }
        eventText={
          pendingUserActionEvent
            ? getEventDisplayText(pendingUserActionEvent)
            : undefined
        }
        playerType={
          player ? getPlayerTypeString(player.player_type) : "striker"
        }
        teamNumber={pendingUserActionEvent ? pendingUserActionEvent.team : 0}
        onDecisionSelect={async (decisionIndex: number) => {
          const actionType = pendingUserActionEvent
            ? getMatchActionType(pendingUserActionEvent.action)
            : "OpenPlay";
          const teamNumber = pendingUserActionEvent
            ? pendingUserActionEvent.team
            : 0;
          const matchDecisionEnum = mapDecisionToEnum(
            actionType,
            decisionIndex,
            teamNumber
          );
          console.log(
            `🎮 Decision selected: index ${decisionIndex} → enum ${matchDecisionEnum} for action type: ${actionType}, team: ${teamNumber}`
          );
          if (pendingUserActionEvent) {
            await handleActionSelected(matchDecisionEnum);
          }
        }}
        // 🎯 Result display props
        isShowingResult={isShowingActionResult}
        isLoadingResult={isLoadingActionResult}
        resultText={actionResultText}
        onContinue={handleContinueFromResult}
        isChainedActionResult={isChainedActionResult}
        // 🎯 NEW: Decision minute events capture
        onCaptureMinuteEvents={captureDecisionMinuteEvents}
        currentMinute={
          pendingUserActionEvent ? pendingUserActionEvent.minute : currentMinute
        }
        allTimelineEvents={allTimelineEvents}
        onStoreUIText={storeDecisionMinuteUIText}
      />
    </div>
  );
};

export default MatchComponent;
