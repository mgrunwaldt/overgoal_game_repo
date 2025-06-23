import React, { useState, useEffect, useRef } from "react";
import MatchEventIten from "../ui/matchEventIten";
import StaminaBar from "../ui/StaminaBar";
import MatchDecision from "./MatchDecision";
import { useNavigate, useParams } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";

interface MatchEvent {
  text: string;
  playable: boolean;
  team: "player" | "enemy";
}

const possibleEvents = [
  "Shot on goal",
  "Save by GK",
  "Foul at midfield",
  "Corner kick",
  "Goal!",
  "Offside",
  "Yellow card",
  "Red card",
  "Free kick",
  "Penalty kick",
];

const importantEnemyEvents = [
  "Enemy Goal!",
  "Enemy Penalty",
  "Enemy Red Card",
  "Enemy Free Kick",
];

const MatchComponent = () => {
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([
    { text: "Pass to #10", playable: false, team: "player" },
    { text: "Shot on goal", playable: true, team: "player" },
    { text: "Save by GK", playable: false, team: "player" },
    { text: "Substitution: #8 in, #7 out", playable: false, team: "player" },
    { text: "Foul at midfield", playable: true, team: "player" },
  ]);

  const [stamina, setStamina] = useState<number>(100);
  const [isDecisionOpen, setDecisionOpen] = useState(false);
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { matchId } = useParams();
  const timer = useCountdown();

  useEffect(() => {
    const eventInterval = setInterval(() => {
      // 20% chance for an important enemy event

      // 40% chance to open a popup
      if (Math.random() < 0.4) {
        setDecisionOpen(true); // Or your own popup handling logic
      }

      if (Math.random() < 0.2) {
        const newEventText =
          importantEnemyEvents[
            Math.floor(Math.random() * importantEnemyEvents.length)
          ];
        setMatchEvents((prevEvents) => [
          ...prevEvents,
          { text: newEventText, playable: false, team: "enemy" },
        ]);
      } else {
        const newEventText =
          possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
        const isPlayable = Math.random() > 0.8; // ~20% of events are playable
        setMatchEvents((prevEvents) => [
          ...prevEvents,
          { text: newEventText, playable: isPlayable, team: "player" },
        ]);
      }
    }, 1000);

    return () => clearInterval(eventInterval);
  }, [matchEvents]);

  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop =
        eventContainerRef.current.scrollHeight;
    }
  }, [matchEvents]);

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
              0- 0
            </p>
            <p
              className="text-white text-2xl"
              style={{ textShadow: "0 0 10px #0ff" }}
            >
              {timer}
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
        <img src="/match/Logo.png" alt="Logo" className="w-24 h-24" />
        {timer === 0 && (
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
