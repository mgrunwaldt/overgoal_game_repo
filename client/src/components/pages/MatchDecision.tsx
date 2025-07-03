import React, { useState, useEffect, useRef } from "react";
import MatchDecisionItem from "../ui/matchDecisionItem";
import { MatchTimelineEvent } from "../../dojo/hooks/types";

type MatchActionType =
  | "OpenPlay"
  | "Freekick"
  | "Penalty"
  | "Defense Open Play"
  | "Jumper"
  | "brawl";

interface MatchDecisionProps {
  isOpen: boolean;
  onClose: () => void;
  matchActionType?: MatchActionType;
  onDecisionSelect?: (decisionIndex: number) => void;
  eventText?: string;
  playerType?: string;
  isShowingResult?: boolean;
  isLoadingResult?: boolean;
  resultText?: string;
  onContinue?: () => void;
  teamNumber?: number; // 0 = your team, 1 = opponent team
  isChainedActionResult?: boolean; // If true, don't show Continue button
  // 🎯 NEW: Props for capturing decision minute events
  onCaptureMinuteEvents?: (minute: number) => void;
  currentMinute?: number;
  allTimelineEvents?: MatchTimelineEvent[];
  onStoreUIText?: (uiText: string) => void;
}

const MatchDecision: React.FC<MatchDecisionProps> = ({
  isOpen,
  onClose,
  matchActionType = "OpenPlay",
  onDecisionSelect,
  eventText,
  playerType = "striker",
  isShowingResult,
  isLoadingResult,
  resultText,
  onContinue,
  teamNumber = 0,
  isChainedActionResult = false,
  onCaptureMinuteEvents,
  currentMinute,
  allTimelineEvents,
  onStoreUIText,
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  // 🎯 NEW: Track if we've captured events for this modal session
  const hasCapturedEventsRef = useRef(false);
  // 🎯 NEW: Track if we've stored the initial action text
  const hasStoredActionTextRef = useRef(false);
  // 🎯 NEW: Track if we've stored the result text
  const hasStoredResultTextRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(5); // Reset timer when closed
      // 🎯 Reset capture flag when modal closes
      hasCapturedEventsRef.current = false;
      hasStoredActionTextRef.current = false;
      hasStoredResultTextRef.current = false;
      return;
    }

    // 🎯 NEW: Don't countdown when showing results or loading
    if (isShowingResult || isLoadingResult) {
      return; // Pause timer when showing results or loading
    }

    if (timeLeft === 0) {
      //   onClose(); // Auto-close when timer ends
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isOpen, onClose, isShowingResult, isLoadingResult]);

  // 🎯 NEW: Capture timeline events ONLY ONCE when modal opens
  useEffect(() => {
    if (
      isOpen &&
      onCaptureMinuteEvents &&
      currentMinute !== undefined &&
      allTimelineEvents &&
      !hasCapturedEventsRef.current
    ) {
      console.log(
        "📋 MatchDecision opened - capturing events for minute:",
        currentMinute
      );
      onCaptureMinuteEvents(currentMinute);
      hasCapturedEventsRef.current = true; // Mark as captured
    }
  }, [isOpen]); // 🎯 FIX: Only depend on isOpen to avoid infinite loops

  // 🎯 NEW: Store action text when modal shows decision mode
  useEffect(() => {
    if (
      isOpen &&
      !isShowingResult &&
      !isLoadingResult &&
      eventText &&
      currentMinute !== undefined &&
      onStoreUIText &&
      !hasStoredActionTextRef.current
    ) {
      const actionText = `${currentMinute}' - ${eventText} - YOU PARTICIPATED`;
      console.log("📋 Storing action text:", actionText);
      onStoreUIText(actionText);
      hasStoredActionTextRef.current = true;
    }
    // 🎯 FIX: Reset result text ref when going back to action mode (for chained events)
    if (isOpen && !isShowingResult && !isLoadingResult) {
      hasStoredResultTextRef.current = false;
    }
  }, [
    isOpen,
    isShowingResult,
    isLoadingResult,
    eventText,
    currentMinute,
    onStoreUIText,
  ]);

  // 🎯 NEW: Store result text ONLY ONCE when modal shows result
  useEffect(() => {
    if (
      isOpen &&
      isShowingResult &&
      resultText &&
      currentMinute !== undefined &&
      onStoreUIText &&
      !hasStoredResultTextRef.current
    ) {
      const fullResultText = `${currentMinute}' - ${resultText}`;
      console.log("📋 Storing result text:", fullResultText);
      onStoreUIText(fullResultText);
      hasStoredResultTextRef.current = true; // Mark as stored
    }
    // 🎯 FIX: Reset action text ref when going to result mode (for chained events)
    if (isOpen && isShowingResult) {
      hasStoredActionTextRef.current = false;
    }
  }, [isOpen, isShowingResult, resultText]); // 🎯 FIX: Remove onStoreUIText and currentMinute from deps to prevent loops

  if (!isOpen) return null;

  const getDecisionsByActionType = (
    actionType: MatchActionType,
    teamNumber: number
  ): string[] => {
    switch (actionType) {
      case "OpenPlay":
        // If opponent team has the ball (teamNumber = 1), show defensive options
        if (teamNumber === 1) {
          return ["Standing tackle", "Sweeping tackle"];
        }
        // If your team has the ball (teamNumber = 0), show offensive options
        return ["Pass", "Dribble", "Shoot", "Simulate foul"];
      case "Freekick":
        return ["Cross", "Shoot"];
      case "Penalty":
        return ["Shoot at center", "Shoot at corner", "Panenka penalty"];
      case "Defense Open Play":
        return ["Standing tackle", "Sweeping tackle"];
      case "Jumper":
        return ["Accept hug", "Tackle fan"];
      case "brawl":
        return ["Join brawl", "Stay out"];
      default:
        return ["Pass", "Dribble", "Shoot", "Simulate foul"];
    }
  };

  const getEventImage = (
    actionType: MatchActionType,
    playerType: string
  ): string => {
    const normalizedPlayerType = playerType.toLowerCase();

    switch (actionType) {
      case "OpenPlay":
        return `/matchEvents/open_play_${normalizedPlayerType}.png`;
      case "Freekick":
        return `/matchEvents/free_kick_${normalizedPlayerType}.png`;
      case "Penalty":
        return `/matchEvents/penalty_${normalizedPlayerType}.png`;
      case "Defense Open Play":
        return `/matchEvents/open_defense_${normalizedPlayerType}.png`;
      case "Jumper":
        return `/matchEvents/jumper.png`; // No player-specific variant
      case "brawl":
        return `/matchEvents/brawl.png`; // No player-specific variant
      default:
        return `/matchEvents/open_play_${normalizedPlayerType}.png`;
    }
  };

  const decisions = getDecisionsByActionType(matchActionType, teamNumber);
  const displayText = eventText || "What do you want to do?";
  const eventImage = getEventImage(matchActionType, playerType);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center relative">
        {/* Timer */}
        <div
          className="absolute top-0 left-5 w-24 h-24 bg-contain bg-no-repeat bg-center flex items-center justify-center"
          style={{
            backgroundImage: "url('/matchDecision/time-container.png')",
          }}
        >
          <span
            className="text-white text-4xl font-bold"
            style={{ textShadow: "0 0 15px #0ff" }}
          >
            {timeLeft}
          </span>
        </div>

        {/* Player Display */}
        <div className="w-[380px] h-[450px] bg-contain bg-no-repeat bg-center flex items-center justify-center p-4">
          <img
            src={eventImage}
            alt={`${matchActionType} - ${playerType}`}
            className="max-h-[85%] max-w-[85%] object-contain"
          />
        </div>

        {/* Decision Panel */}
        <div
          className="w-[460px] h-[500px] bg-contain bg-no-repeat bg-center -mt-24 flex flex-col items-center justify-center p-24"
          style={{ backgroundImage: "url('/matchDecision/Decision pop.png')" }}
        >
          {isLoadingResult ? (
            // 🎯 LOADING MODE
            <>
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-transparent mb-6"></div>
                <p
                  className="text-cyan-200 text-center text-xl font-semibold"
                  style={{ textShadow: "0 0 8px rgba(34,211,238,0.7)" }}
                >
                  Processing your action...
                </p>
              </div>
            </>
          ) : isShowingResult ? (
            // 🎯 RESULT DISPLAY MODE
            <>
              <p
                className="text-cyan-200 text-center text-xl mb-8 leading-relaxed font-semibold"
                style={{ textShadow: "0 0 8px rgba(34,211,238,0.7)" }}
              >
                {resultText}
              </p>
              {/* Only show Continue button for normal results, not chained action results */}
              {!isChainedActionResult && (
                <div className="w-full flex justify-center">
                  <MatchDecisionItem
                    text="Continue"
                    onClick={() => {
                      if (onContinue) {
                        onContinue();
                      }
                      onClose();
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            // 🎯 DECISION SELECTION MODE
            <>
              <p
                className="text-cyan-200 text-center text-lg mb-6 leading-relaxed"
                style={{ textShadow: "0 0 8px rgba(34,211,238,0.7)" }}
              >
                {displayText}
              </p>
              <div className="w-full flex flex-col items-center space-y-2">
                {decisions.map((text, index) => (
                  <MatchDecisionItem
                    key={index}
                    text={text}
                    onClick={() => {
                      if (onDecisionSelect) {
                        onDecisionSelect(index);
                      }
                      // onClose();
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDecision;
