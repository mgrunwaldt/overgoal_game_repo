import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../../zustand/store";
import gsap from "gsap";

const NonMatchResult = () => {
  const navigate = useNavigate();
  const { player, lastNonMatchOutcome } = useAppStore();
  const [hasChecked, setHasChecked] = React.useState(false);

  // Refs for animated elements
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Animation setup
  useEffect(() => {
    if (!hasChecked) return;

    // Set initial state
    gsap.set([headerRef.current, statsRef.current], {
      // y: -50,
      opacity: 0,
    });

    // Create animation timeline
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate elements in sequence
    tl.to(headerRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.6,
    })
      .to(
        statsRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
        },
        "-=0.3"
      )
      .to(
        buttonRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
        },
        "-=0.3"
      );

    return () => {
      tl.kill();
    };
  }, [hasChecked]);

  useEffect(() => {
    // If we have data, we're good to go
    if (lastNonMatchOutcome) {
      setHasChecked(true);
      return;
    }

    // If no data yet, wait a bit for it to arrive
    const timer = setTimeout(() => {
      setHasChecked(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [lastNonMatchOutcome]);

  // Show loading while we check for data
  if (!hasChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading result...</p>
        </div>
      </div>
    );
  }

  const outcomeType =
    lastNonMatchOutcome?.outcome_type === 1 ? "Positive" : "Negative";
  const outcomeColor =
    outcomeType === "Positive" ? "text-green-400" : "text-red-400";

  // Helper function to get color based on delta
  const getDeltaColor = (delta: number): string => {
    if (delta > 0) return "text-green-400";
    if (delta < 0) return "text-red-400";
    return "text-white"; // neutral/no change
  };

  const allStats =
    player && lastNonMatchOutcome
      ? [
          {
            name: "CHARISMA",
            value: player.charisma,
            delta: lastNonMatchOutcome.charisma_delta,
            color: getDeltaColor(lastNonMatchOutcome.charisma_delta),
          },
          {
            name: "MONEY",
            value: player.coins,
            delta: lastNonMatchOutcome.coins_delta,
            color: getDeltaColor(lastNonMatchOutcome.coins_delta),
          },
          {
            name: "DRIBBLING",
            value: player.dribble,
            delta: lastNonMatchOutcome.dribble_delta,
            color: getDeltaColor(lastNonMatchOutcome.dribble_delta),
          },
          {
            name: "ENERGY",
            value: player.energy,
            delta: lastNonMatchOutcome.energy_delta,
            color: getDeltaColor(lastNonMatchOutcome.energy_delta),
          },
          {
            name: "FAME",
            value: player.fame,
            delta: lastNonMatchOutcome.fame_delta,
            color: getDeltaColor(lastNonMatchOutcome.fame_delta),
          },
          {
            name: "FREE KICK",
            value: player.free_kick,
            delta: lastNonMatchOutcome.free_kick_delta,
            color: getDeltaColor(lastNonMatchOutcome.free_kick_delta),
          },
          {
            name: "INTELLIGENCE",
            value: player.intelligence,
            delta: lastNonMatchOutcome.intelligence_delta,
            color: getDeltaColor(lastNonMatchOutcome.intelligence_delta),
          },
          {
            name: "PASSING",
            value: player.passing,
            delta: lastNonMatchOutcome.passing_delta,
            color: getDeltaColor(lastNonMatchOutcome.passing_delta),
          },
          {
            name: "INJURED",
            value: player.is_injured ? "YES" : "NO",
            delta: lastNonMatchOutcome.sets_injured ? 1 : 0,
            color: lastNonMatchOutcome.sets_injured
              ? "text-red-400"
              : "text-white",
            isInjury: true,
          },
          {
            name: "SHOOTING",
            value: player.shoot,
            delta: lastNonMatchOutcome.shoot_delta,
            color: getDeltaColor(lastNonMatchOutcome.shoot_delta),
          },
          {
            name: "STAMINA",
            value: player.stamina,
            delta: lastNonMatchOutcome.stamina_delta,
            color: getDeltaColor(lastNonMatchOutcome.stamina_delta),
          },
          {
            name: "TEAM RELATIONSHIP",
            value: player.team_relationship,
            delta: lastNonMatchOutcome.team_relationship_delta,
            color: getDeltaColor(lastNonMatchOutcome.team_relationship_delta),
          },
        ]
      : [];

  // Filter to only show stats with non-zero deltas
  const stats = allStats.filter((stat) =>
    stat.isInjury ? lastNonMatchOutcome?.sets_injured : stat.delta !== 0
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-cover bg-center"
      style={{ backgroundImage: "url('/nonMatchResult/BackGround.png')" }}
    >
      <img
        src="/nonMatchResult/Npc.png"
        alt="Character"
        className="absolute top-6 left-5 w-24 z-10"
      />
      <div className="w-full max-w-lg flex flex-col items-center text-center">
        {/* Character Display */}
        <div ref={headerRef} className="relative w-full mb-4 pt-16 opacity-0">
          <div className="rounded-xl bg-black/80 p-10 border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <h3
              className={`text-xl font-bold text-center mb-2 ${outcomeColor}`}
            >
              {outcomeType} Outcome!
            </h3>
            <p className="text-white text-lg text-center px-4">
              {lastNonMatchOutcome?.description ||
                "No outcome description available."}
            </p>
          </div>
        </div>

        {/* Stats Board */}
        <div
          ref={statsRef}
          className="w-[300px] h-[300px] bg-contain bg-black/80 rounded-xl g-no-repeat bg-center flex flex-col items-center justify-center px-6 opacity-0"
          style={{ backgroundImage: "url('/nonMatchResult/Stats board.png')" }}
        >
          <ul className="w-full space-y-6 p-2 ">
            {stats.map((stat: any) => (
              <li
                key={stat.name}
                className="flex justify-between items-center w-full "
              >
                <span className="text-cyan-300 text-lg font-bold">
                  {stat.name}
                </span>
                <span
                  className={`text-2xl font-bold text-cyan-300 flex items-center gap-2`}
                  style={{ textShadow: "0 0 10px #0ff" }}
                >
                  <span
                    className={`text-grt-300 text-xl font-bold ${stat.color}`}
                  >
                    {" "}
                    {stat.isInjury
                      ? ""
                      : `(${stat.delta > 0 ? "+" : ""}${stat.delta})`}
                  </span>
                  {stat.value}{" "}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Button */}
        <div className="w-full flex justify-end mt-12">
          <button
            ref={buttonRef}
            onClick={() => {
              navigate("/main");
            }}
            className="w-40 h-14 bg-contain bg-no-repeat bg-center text-white text-lg font-bold flex items-center justify-center pr-4 transition-all duration-300 transform hover:scale-105 opacity-1"
            style={{
              backgroundImage: "url('/nonMatchResult/Next Button.png')",
            }}
          ></button>
        </div>
      </div>
    </div>
  );
};

export default NonMatchResult;
