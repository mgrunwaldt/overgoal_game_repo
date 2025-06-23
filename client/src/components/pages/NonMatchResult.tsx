import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../../zustand/store";

const NonMatchResult = () => {
  const navigate = useNavigate();
  const { player, last_non_match_outcome } = useAppStore();
  const [hasChecked, setHasChecked] = React.useState(false);

  useEffect(() => {
    // If we have data, we're good to go
    if (last_non_match_outcome) {
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
  }, [last_non_match_outcome]);

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



  const outcomeType = last_non_match_outcome?.outcome_type === 1 ? "Positive" : "Negative";
  const outcomeColor = outcomeType === "Positive" ? "text-green-400" : "text-red-400";

  // Helper function to get color based on delta
  const getDeltaColor = (delta: number): string => {
    if (delta > 0) return "text-green-400";
    if (delta < 0) return "text-red-400";
    return "text-white"; // neutral/no change
  };

  const allStats = player && last_non_match_outcome ? [
    { 
      name: 'CHARISMA', 
      value: player.charisma, 
      delta: last_non_match_outcome.charisma_delta,
      color: getDeltaColor(last_non_match_outcome.charisma_delta)
    },
    { 
      name: 'MONEY', 
      value: player.coins, 
      delta: last_non_match_outcome.coins_delta,
      color: getDeltaColor(last_non_match_outcome.coins_delta)
    },
    { 
      name: 'DRIBBLING', 
      value: player.dribble, 
      delta: last_non_match_outcome.dribble_delta,
      color: getDeltaColor(last_non_match_outcome.dribble_delta)
    },
    { 
      name: 'ENERGY', 
      value: player.energy, 
      delta: last_non_match_outcome.energy_delta,
      color: getDeltaColor(last_non_match_outcome.energy_delta)
    },
    { 
      name: 'FAME', 
      value: player.fame, 
      delta: last_non_match_outcome.fame_delta,
      color: getDeltaColor(last_non_match_outcome.fame_delta)
    },
    { 
      name: 'FREE KICK', 
      value: player.free_kick, 
      delta: last_non_match_outcome.free_kick_delta,
      color: getDeltaColor(last_non_match_outcome.free_kick_delta)
    },
    { 
      name: 'INTELLIGENCE', 
      value: player.intelligence, 
      delta: last_non_match_outcome.intelligence_delta,
      color: getDeltaColor(last_non_match_outcome.intelligence_delta)
    },
    { 
      name: 'PASSING', 
      value: player.passing, 
      delta: last_non_match_outcome.passing_delta,
      color: getDeltaColor(last_non_match_outcome.passing_delta)
    },
    { 
      name: 'INJURED', 
      value: player.is_injured ? 'YES' : 'NO', 
      delta: last_non_match_outcome.sets_injured ? 1 : 0,
      color: last_non_match_outcome.sets_injured ? "text-red-400" : "text-white",
      isInjury: true
    },
    { 
      name: 'SHOOTING', 
      value: player.shoot, 
      delta: last_non_match_outcome.shoot_delta,
      color: getDeltaColor(last_non_match_outcome.shoot_delta)
    },
    { 
      name: 'STAMINA', 
      value: player.stamina, 
      delta: last_non_match_outcome.stamina_delta,
      color: getDeltaColor(last_non_match_outcome.stamina_delta)
    },
    { 
      name: 'TEAM RELATIONSHIP', 
      value: player.team_relationship, 
      delta: last_non_match_outcome.team_relationship_delta,
      color: getDeltaColor(last_non_match_outcome.team_relationship_delta)
    },
  ] : [];

  // Filter to only show stats with non-zero deltas
  const stats = allStats.filter(stat => 
    stat.isInjury ? last_non_match_outcome?.sets_injured : stat.delta !== 0
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-cover bg-center"
      style={{ backgroundImage: "url('/nonMatchResult/BackGround.png')" }}
    >
      <img
        src="/nonMatchResult/Npc.png"
        alt="Character"
        className="absolute top-10 left-5 w-24 z-10"
      />
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Character Display */}
        <div className="relative w-full mb-4 pt-16">
          <div className="rounded-xl bg-black/80 p-4 pt-16 border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <h3
              className={`text-xl font-bold text-center mb-2 ${outcomeColor}`}
            >
              {outcomeType} Outcome!
            </h3>
            <p className="text-white text-lg ml-8 text-center px-4">
              {last_non_match_outcome?.description ||
                "No outcome description available."}
            </p>
          </div>
        </div>

        {/* Stats Board */}
        <div
          className="w-full h-auto bg-contain bg-black/80 bg-no-repeat bg-center flex flex-col items-center justify-center p-12"
          style={{ backgroundImage: "url('/nonMatchResult/Stats board.png')" }}
        >
          <ul className="w-full space-y-2">
            {stats.map((stat) => (
              <li
                key={stat.name}
                className="flex justify-between items-center w-full"
              >
                <span className="text-cyan-300 text-lg font-bold">
                  {stat.name}
                </span>
                <span className={`text-2xl font-bold ${stat.color}`} style={{ textShadow: '0 0 10px #0ff' }}>
                  {stat.value} {stat.isInjury ? '' : `(${stat.delta > 0 ? '+' : ''}${stat.delta})`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Button */}
        <div className="w-full flex justify-end mt-4">
          <button
            onClick={() => {
              navigate("/main");
            }}
            className="w-40 h-14 bg-contain bg-no-repeat bg-center text-white text-lg font-bold flex items-center justify-center pr-4 transition-transform transform hover:scale-105"
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
