import React from "react";

interface StatsPopupProps {
  stats: {
    stamina: number;
    energy: number;
    charisma: number;
    dribble: number;
    fame: number;
    shoot: number;
    passing: number;
    intelligence: number;
  };
  playerType: string;
  onClose: () => void;
  teamName: string;
  teamPoints: number;
}

const getPlayerImage = (playerType: String): String => {
  switch (playerType) {
    case "Striker":
      return "/preMatch/Player 9.png";
    case "Dribbler":
      return "/preMatch/Player 11.png";
    case "Playmaker":
      return "/preMatch/Player 10.png";
    default:
      return "/preMatch/Player 10.png"; // optional default case
  }
};

const StatsPopup: React.FC<StatsPopupProps> = ({
  stats,
  playerType,
  onClose,
  teamName,
  teamPoints,
}) => {
  const [playerImage, setPlayerImage] = React.useState(
    getPlayerImage(playerType)
  );
  const statsDetail = stats
    ? [
        { name: "SHOOT", value: stats.shoot },
        { name: "DRIBBLING", value: stats.dribble },
        { name: "PASSING", value: stats.passing },
        { name: "STAMINA", value: stats.stamina },
        { name: "FAME", value: stats.fame },
        { name: "CHARISMA", value: stats.charisma },
        { name: "INTELLIGENCE", value: stats.intelligence },
      ]
    : [];

  return (
    <div
      className="absolute min-h-screen w-full flex flex-col items-center justify-start pt-12 p-8 bg-cover bg-center"
      style={{ backgroundImage: "url('/nonMatchResult/BackGround.png')" }}
    >
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Character Display */}
        <div>
          <h2 className="text-4xl text-center font-bold mb-2 text-cyan-300 glow px-6">
            Player Stats
          </h2>
          <div className="border-b-2 border-cyan-400/50 rounded-xl mb-6 w-full" />
          <div className="flex flex-row items-center gap-x-6">
            <img src={playerImage} alt="Player" className="w-40" />
            <div className="border-2 border-cyan-400/50 rounded-xl">
              <div className="flex flex-col text-center items-center p-2 ">
                <span className="text-white text-lg font-bold">{teamName}</span>
                <span className="text-yellow-300 text-2xl font-bold">
                  Points: {teamPoints}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Board */}
        <div className="w-full h-auto bg-contain bg-no-repeat bg-center flex flex-col bg-black/80 items-center justify-center p-2 mt-6 border-2 border-cyan-400/50 rounded-2xl ">
          <ul
            className="w-full h-full p-12   flex flex-col items-center justify-center "
            style={{
              backgroundImage: "url('/nonMatchResult/Stats board.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {statsDetail.map((stat) => (
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
        {/* Back Button */}
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20">
          <button
            onClick={onClose}
            className="transform hover:scale-105 transition-transform duration-200"
          >
            <img
              src="/CharacterSelection/Back Button.png"
              alt="Back"
              className="w-32 h-16 md:w-24 md:h-12 object-contain"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsPopup;
