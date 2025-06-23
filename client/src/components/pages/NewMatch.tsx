import { useEffect, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useSimulateGameMatchAction } from "../../dojo/hooks/useSimulateGameMatchAction";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Info, Hash, Clock, Users } from "lucide-react";
import useAppStore from "../../zustand/store";
import type { Team, GameMatch, MatchStatus } from "../../zustand/store";
import StaminaBar from "../ui/StaminaBar";

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

const getRandomDifferentPlayerType = (playerType: string): string => {
  const playerTypes = ["striker", "dribble", "playmaker"];

  // Filter out the input type
  const otherTypes = playerTypes.filter((type) => type !== playerType);

  // Edge case: if no other types available
  if (otherTypes.length === 0) {
    throw new Error("No other player types available.");
  }

  const randomIndex = Math.floor(Math.random() * otherTypes.length);

  switch (otherTypes[randomIndex]) {
    case "striker":
      return "/preMatch/Player 9 red.png";
    case "dribble":
      return "/preMatch/Player 11 red.png";
    case "playmaker":
      return "/preMatch/Player 10 red.png";
    default:
      return "/preMatch/Player 9 red.png";
  }
};

export default function NewMatch() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const { player } = usePlayer();
  const { teams } = useTeams();
  const { gameMatches } = useAppStore();
  const {
    simulateGameMatchState,
    executeSimulateGameMatch,
    canSimulateGameMatch,
    isLoading: isSimulating,
    error: simulateError,
  } = useSimulateGameMatchAction();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);
  const [currentGameMatch, setCurrentGameMatch] = useState<GameMatch | null>(
    null
  );
  const [playerImage, setPlayerImage] = useState<String>(
    "/preMatch/Player 10.png"
  );
  const [myTeamImage, setMyTeamImage] = useState<string>("");
  const [opponentTeamImage, setOpponentTeamImage] = useState<string>("");
  const [stamina, setStamina] = useState<number>(100);
  const [enemyPlayerImage, setEnemyPlayerImage] = useState<string>(
    "/preMatch/Player 9 red.png"
  );

  useEffect(() => {
    if (selectedTeam) {
      setMyTeamImage(`/teams/${selectedTeam.team_id}.png`);
    }
    if (opponentTeam) {
      setOpponentTeamImage(`/teams/${opponentTeam.team_id}.png`);
    }
  }, [selectedTeam, opponentTeam]);

  useEffect(() => {
    if (player && teams.length > 0) {
      console.log("🎯 playerTypeMati", player.player_type);
      const image = getPlayerImage(player.player_type.toString());
      console.log("🎯 image", image);
      setPlayerImage(image);
      setStamina(player.stamina);
      setEnemyPlayerImage(
        getRandomDifferentPlayerType(player.player_type.toString())
      );
      // Find the player's selected team (Team 1)
      const playerTeam = teams.find(
        (team) => team.team_id === player.selected_team_id
      );
      setSelectedTeam(playerTeam || null);
    }
  }, [player, teams]);

  // Find the specific match by ID from URL parameter
  useEffect(() => {
    if (matchId && gameMatches.length > 0) {
      const matchIdNumber = parseInt(matchId, 10);
      const targetMatch = gameMatches.find(
        (match) => match.match_id === matchIdNumber
      );

      console.log("🎯 targetMatch", targetMatch);

      if (targetMatch) {
        setCurrentGameMatch(targetMatch);

        // Find opponent team based on the match data
        const opponent = teams.find(
          (team) => team.team_id === targetMatch.opponent_team_id
        );
        setOpponentTeam(opponent || null);
      } else {
        console.warn(`Match with ID ${matchIdNumber} not found in gameMatches`);
        // Fallback: redirect to main if match not found
        navigate("/main");
      }
    } else if (!matchId) {
      // No match ID provided, redirect to main
      console.warn("No match ID provided in URL");
      navigate("/main");
    }
  }, [matchId, gameMatches, teams, navigate]);

  // Handle play match (simulate) - IDENTICAL to MainScreen pattern
  const handlePlayMatch = async () => {
    if (!currentGameMatch) {
      console.error("No match found to simulate");
      return;
    }

    try {
      console.log("🎮 Simulating match...");
      await executeSimulateGameMatch(currentGameMatch.match_id);

      // Navigate to MatchEnd screen after successful simulation
      if (simulateGameMatchState === "success") {
        navigate("/match-end");
      }
    } catch (error) {
      console.error("Failed to simulate match:", error);
    }
  };

  // Navigate to MatchEnd when simulation is successful
  useEffect(() => {
    console.log(
      "🔍 NewMatch useEffect triggered - simulateGameMatchState:",
      simulateGameMatchState
    );
    if (simulateGameMatchState === "success" && currentGameMatch) {
      console.log(
        "✅ Match simulation successful, navigating to match-end with ID:",
        currentGameMatch.match_id
      );
      navigate(`/match-end/${currentGameMatch.match_id}`);
    }
  }, [simulateGameMatchState, navigate, currentGameMatch]);

  const getMatchStatusText = (status: number): string => {
    switch (status) {
      case 0:
        return "Not Started";
      case 1:
        return "In Progress";
      case 2:
        return "Half Time";
      case 3:
        return "Finished";
      default:
        return "Unknown";
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: "url('/Screens/login/BackGround.png')" }}
    >
      <div className="flex flex-col justify-between items-center w-full h-full  ">
        <div className="w-full flex justify-center items-center mb-4 ">
          <StaminaBar useAnimation={false} initialStamina={stamina} />
        </div>

        <div className="flex justify-between space-y-12 flex-col h-full p-4">
          <div className="flex flex-row space-x-2 justify-between items-center ">
            <img src={myTeamImage} className="w-24 h-24" alt="My Team" />
            <img
              src="/preMatch/Vs.png"
              alt=""
              className="relative top-16 left-1 w-16 h-12"
            />
            <img
              src={opponentTeamImage}
              alt="Opponent Team"
              className="w-24 h-24"
            />
          </div>

          <div className="flex flex-col space-x-2 justify-between items-center  ">
            <img
              className="object-contain w-32 h-20"
              src="/preMatch/Player to watch.png"
              alt=""
            />
            <div className="flex flex-row space-x-2 justify-between items-center  ">
              <img
                src={playerImage as string}
                className="object-contain w-40 h-40"
                alt=""
              />

              <img
                src={enemyPlayerImage}
                alt=""
                className="object-contain w-40 h-40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      {/* <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/main")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-cyan-400">New Match</h1>
        <div></div>
      </div> */}

      {/* Verification Panel */}
      {currentGameMatch && (
        <div className="max-w-4xl mx-auto mb-8 bg-black/60 rounded-xl">
          <div className="bg-blue-900/20 border border-blue-500/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-400">
                Match Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Teams:</span>
                <span className="text-yellow-400">
                  {selectedTeam?.name} vs {opponentTeam?.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Status:</span>
                <span className="text-purple-400">
                  {getMatchStatusText(currentGameMatch.match_status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Setup */}
      <div className="max-w-4xl mx-auto mt-auto">
        <div className="w-full flex flex-col items-center mt-5 justify-center pb-8 z-100">
          <button
            onClick={handlePlayMatch}
            disabled={
              !selectedTeam ||
              !opponentTeam ||
              !currentGameMatch ||
              !canSimulateGameMatch ||
              isSimulating
            }
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <div className="text-white bg-black/50 rounded-lg p-4">
                Creating Match...
              </div>
            ) : (
              <img
                src="/preMatch/Next Button.png"
                alt="Play Match"
                className="w-36 h-auto shadow-lg hover:scale-105 transition-transform transform"
              />
            )}
          </button>
          {/* Error display */}
          {simulateError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {simulateError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
