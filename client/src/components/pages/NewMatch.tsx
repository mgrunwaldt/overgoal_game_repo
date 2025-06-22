import { useEffect, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useSimulateGameMatchAction } from "../../dojo/hooks/useSimulateGameMatchAction";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Info, Hash, Clock, Users } from "lucide-react";
import useAppStore from "../../zustand/store";
import type { Team, GameMatch, MatchStatus } from "../../zustand/store";


const getPlayerImage = (playerType: String): String => {
  switch (playerType) {
    case "Striker":
      return "/preMatch/Player 9.png";
    case "Dribble":
      return "/preMatch/Player 11.png";
    case "Playmaker":
      return "/preMatch/Player 10.png";
    default:
      return "/preMatch/Player 10.png"; // optional default case
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
    error: simulateError 
  } = useSimulateGameMatchAction();
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);
  const [currentGameMatch, setCurrentGameMatch] = useState<GameMatch | null>(null);
  const [playerImage, setPlayerImage] = useState<String>("/preMatch/Player 10.png")
  const [myTeamImage, setMyTeamImage] = useState<string>("");
  const [opponentTeamImage, setOpponentTeamImage] = useState<string>("");

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
      const image = getPlayerImage(player.player_type.toString())
      setPlayerImage(image)
      // Find the player's selected team (Team 1)
      const playerTeam = teams.find(team => team.team_id === player.selected_team_id);
      setSelectedTeam(playerTeam || null);
    }
  }, [player, teams]);

  // Find the specific match by ID from URL parameter
  useEffect(() => {
    if (matchId && gameMatches.length > 0) {
      const matchIdNumber = parseInt(matchId, 10);
      const targetMatch = gameMatches.find(match => match.match_id === matchIdNumber);
      
      console.log("🎯 targetMatch", targetMatch);

      if (targetMatch) {
        setCurrentGameMatch(targetMatch);
        
        // Find opponent team based on the match data
        const opponent = teams.find(team => team.team_id === targetMatch.opponent_team_id);
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
      if (simulateGameMatchState === 'success') {
        navigate("/match-end");
      }
    } catch (error) {
      console.error("Failed to simulate match:", error);
    }
  };

  // Navigate to MatchEnd when simulation is successful
  useEffect(() => {
    console.log("🔍 NewMatch useEffect triggered - simulateGameMatchState:", simulateGameMatchState);
    if (simulateGameMatchState === 'success' && currentGameMatch) {
      console.log("✅ Match simulation successful, navigating to match-end with ID:", currentGameMatch.match_id);
      navigate(`/match-end/${currentGameMatch.match_id}`);
    }
  }, [simulateGameMatchState, navigate, currentGameMatch]);

  const getMatchStatusText = (status: number): string => {
    switch (status) {
      case 0: return "Not Started";
      case 1: return "In Progress";
      case 2: return "Half Time";
      case 3: return "Finished";
      default: return "Unknown";
    }
  };

  return (
    <div   className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center relative overflow-hidden"
    style={{ backgroundImage: "url('/Screens/login/BackGround.png')" }}>

    <div className="flex flex-col justify-between items-center w-full h-full ">
      <img src="/preMatch/StaminaBar.png"  className="w-3/5 mb-10 " alt="" />

      <div className="flex justify-between space-y-28 flex-col h-full">
      <div className="flex flex-row space-x-2 justify-between items-center ">
        <img src={myTeamImage}  className="w-32 h-40" alt="My Team" />
        <img src="/preMatch/Vs.png" alt=""  className="relative top-16 left-4 w-32 h-40" />
        <img src={opponentTeamImage} alt="Opponent Team" className="w-32 h-40"  />

      </div>

      <div className="flex flex-row space-x-2 justify-between items-center  ">
        <img src={playerImage as string}  className="w-32 h-40" alt="" />
        <img src="/preMatch/Player to watch.png" alt=""  className="relative top-16 w-32 h-40" />
        <img src="/preMatch/Player 9 red.png" alt="" className="w-32 h-40"  />

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
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-400">Match Verification</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Match ID:</span>
                <span className="font-mono text-green-400">{currentGameMatch.match_id}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Teams:</span>
                <span className="text-yellow-400">{currentGameMatch.my_team_id} vs {currentGameMatch.opponent_team_id}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Status:</span>
                <span className="text-purple-400">{getMatchStatusText(currentGameMatch.match_status)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300">Time:</span>
                <span className="text-cyan-400">{currentGameMatch.current_time}'</span>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-400">
              ✅ Match successfully created and stored in blockchain
            </div>
          </div>
        </div>
      )}

  


      {/* Match Setup */}
      <div className="max-w-4xl mx-auto mt-auto">
        <div className="w-full flex flex-col items-center justify-center pb-8 z-100">
            <button
                onClick={handlePlayMatch}
                disabled={!selectedTeam || !opponentTeam || !currentGameMatch || !canSimulateGameMatch || isSimulating}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSimulating ? (
                    <div className="text-white bg-black/50 rounded-lg p-4">Creating Match...</div>
                ) : (
                    <img src="/preMatch/Next Button.png" alt="Play Match" className="w-44 h-auto" />
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