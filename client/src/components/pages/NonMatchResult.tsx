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

  const outcomeType =
    last_non_match_outcome?.outcome_type === 1 ? "Positive" : "Negative";
  const outcomeColor =
    outcomeType === "Positive" ? "text-green-400" : "text-red-400";

  const stats = player
    ? [
        { name: "SHOOT", value: player.shoot },
        { name: "DRIBBLING", value: player.dribble },
        { name: "PASSING", value: player.passing },
        { name: "STAMINA", value: player.stamina },
        { name: "FAME", value: player.fame },
        { name: "CHARISMA", value: player.charisma },
        { name: "INTELLIGENCE", value: player.intelligence },
      ]
    : [];

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
                <span
                  className="text-white text-2xl font-bold"
                  style={{ textShadow: "0 0 10px #0ff" }}
                >
                  {stat.value}
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
