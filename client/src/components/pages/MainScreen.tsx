import { useEffect, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useCreateGameMatchAction } from "../../dojo/hooks/useCreateGameMatchAction";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import useAppStore from "../../zustand/store";
import StatsPopup from "../StatsPopup";

const charactersImages = {
  Striker: "/playerTypes/9.png",
  Playmaker: "/playerTypes/10.png",
  Dribbler: "/playerTypes/11.png",
};

const getCharacterImage = (playerType: string) => {
  return charactersImages[playerType as keyof typeof charactersImages];
};

export default function MainScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedTeamId = location.state?.selectedTeamId;
  const [isStatsPopupOpen, setIsStatsPopupOpen] = useState(false);
  const [characterImage, setCharacterImage] = useState("/playerTypes/10.png");
  const [playerStats, setPlayerStats] = useState({
    stamina: 0,
    energy: 0,
    charisma: 0,
    dribble: 0,
    fame: 0,
    shoot: 0,
    passing: 0,
    intelligence: 0,
  });
  const { player, isLoading: playerLoading } = usePlayer();
  const { teams, refetch: refetchTeams } = useTeams();
  const { handleDisconnect } = useStarknetConnect();
  const { gameMatches } = useAppStore();
  const {
    createGameMatchState,
    executeCreateGameMatch,
    canCreateGameMatch,
    isLoading: isCreatingMatch,
    error: matchError,
  } = useCreateGameMatchAction();

  // Determine the definitive team ID to use
  const teamIdToFind =
    player?.selected_team_id && player.selected_team_id > 0
      ? player.selected_team_id
      : passedTeamId;

  // Find the player's selected team
  const selectedTeam = teams.find((team) => team.team_id === teamIdToFind);

  // Determine loading state
  const isScreenLoading = playerLoading || !player || !selectedTeam;

  useEffect(() => {
    console.log("🎯 MainScreen rendered");
    console.log({
      canCreateGameMatch,
      isCreatingMatch,
      selectedTeam,
      "teams.length < 2": teams.length < 2,
      "player.selected_team_id": player?.selected_team_id,
    });
    if (playerLoading === false && player !== null) {
      setPlayerStats({
        stamina: player.stamina,
        energy: player.energy,
        charisma: player.charisma,
        dribble: player.dribble,
        fame: player.fame,
        shoot: player.shoot,
        passing: player.passing,
        intelligence: player.intelligence,
      });
      const characterImage = getCharacterImage(player.player_type.toString());

      console.log(characterImage);
      console.log(player.player_type);
      setCharacterImage(characterImage);
    }
  }, [playerLoading, player]);

  // Handle new match creation
  const handleNewMatch = async () => {
    if (!player || !selectedTeam || teams.length < 2) {
      console.error(
        "Cannot create match: missing player, selected team, or not enough teams"
      );
      return;
    }

    // Find an opponent team (any team that's not the player's selected team)
    let randomOpponentId;
do {
  randomOpponentId = Math.floor(Math.random() * 14) + 1; // 1 to 14
} while (randomOpponentId === player.selected_team_id);

// Find the opponent team by the random ID
const opponentTeam = teams.find(
  (team) => team.team_id === randomOpponentId
);
    if (!opponentTeam) {
      console.error("Cannot create match: no opponent team found");
      return;
    }

    // Generate a unique match ID (simple timestamp-based for now)
    const matchId = Date.now() % 1000000; // Keep it reasonable for u32

    try {
      console.log("🎮 Creating new match...");
      await executeCreateGameMatch(
        matchId,
        selectedTeam.team_id,
        opponentTeam.team_id
      );

      // Navigate to NewMatch screen after successful creation
      if (createGameMatchState === "success") {
        navigate("/new-match");
      }
    } catch (error) {
      console.error("Failed to create match:", error);
    }
  };

  // Navigate to NewMatch when match creation is successful
  useEffect(() => {
    if (createGameMatchState === "success") {
      // Find the most recent match that was just created
      if (gameMatches.length > 0) {
        const mostRecentMatch = gameMatches.reduce((latest, current) =>
          current.match_id > latest.match_id ? current : latest
        );

        navigate(`/new-match/${mostRecentMatch.match_id}`);
      } else {
        navigate("/new-match");
      }
    }
  }, [createGameMatchState, navigate, gameMatches]);

  if (isScreenLoading) {
    return (
      <div
        className="h-screen w-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4"
        style={{ backgroundImage: "url('/Screens/Main/Background.png')" }}
      >
        <div className="text-center space-y-6">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto" />
          <div className="text-cyan-300 font-bold text-xl">
            Loading Player Data...
          </div>
          <div className="text-cyan-400 text-sm">
            Please wait while we fetch your information
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-between p-4"
      style={{ backgroundImage: "url('/Screens/Main/Background.png')" }}
    >
      <div className="fixed top-70 right-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-blue-800/50 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed top-70  left-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-blue-800/50 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Top Icons */}
      <div className="w-full flex justify-around items-start pt-4 px-4 z-100">
        <button onClick={() => console.log("Ranking Board clicked")} disabled>
          <img
            src="/Screens/Main/Ranking Board.png"
            alt="Ranking Board"
            className="w-24 h-24 object-contain opacity-30 cursor-not-allowed"
          />
        </button>
        <button
          onClick={() => {
            setIsStatsPopupOpen(true);
          }}
        >
          <img
            src="/Screens/Main/Character Stats.png"
            alt="Character Stats"
            className="w-24 h-24 object-contain"
          />
        </button>
        <button onClick={() => console.log("Weekend Cup clicked")} disabled>
          <img
            src="/Screens/Main/Weekend Cup.png"
            alt="Weekend Cup"
            className="w-24 h-24 object-contain opacity-30 cursor-not-allowed"
          />
        </button>
      </div>

      {/* Center Character */}
      <div className="flex-grow flex items-center justify-center z-100">
        <img
          src={characterImage}
          alt="Character"
          className="max-h-[50vh] object-contain"
        />
      </div>

      {/* Play Match Button */}
      <div className="w-full flex flex-col items-center justify-center pb-8 z-100">
        <button
          onClick={handleNewMatch}
          disabled={
            !canCreateGameMatch ||
            isCreatingMatch ||
            !selectedTeam ||
            teams.length < 2
          }
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingMatch ? (
            <div className="text-white bg-black/50 rounded-lg p-4">
              Creating Match...
            </div>
          ) : (
            <img
              src="/Screens/Main/Play Match.png"
              alt="Play Match"
              className="w-72 h-auto"
            />
          )}
        </button>
        {/* Error display */}
        {matchError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {matchError}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="absolute top-2 right-2">
        <button
          className="rounded-full bg-red-900/50 p-3 text-white text-center hover:bg-red-800/70"
          onClick={() => {
            handleDisconnect();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut size={20} />
        </button>
      </div>

      {isStatsPopupOpen && player && selectedTeam && (
        <StatsPopup
          playerType={player.player_type.toString()}
          stats={playerStats}
          onClose={() => setIsStatsPopupOpen(false)}
          teamName={selectedTeam.name}
          teamPoints={selectedTeam.current_league_points}
        />
      )}
    </div>
  );
}
