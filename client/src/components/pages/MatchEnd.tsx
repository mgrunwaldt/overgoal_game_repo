import { useEffect, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useNavigate, useParams } from "react-router-dom";
import { Home, Trophy, Target, Users } from "lucide-react";
import useAppStore from "../../zustand/store";
import type { Team, GameMatch } from "../../zustand/store";

export default function MatchEnd() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const { player } = usePlayer();
  const { teams } = useTeams();
  const { gameMatches } = useAppStore();
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);
  const [currentGameMatch, setCurrentGameMatch] = useState<GameMatch | null>(null);
  const [myTeamImage, setMyTeamImage] = useState<string | null>(null);

  useEffect(() => {
    if (player && teams.length > 0) {
      // Find the player's selected team
      const playerTeam = teams.find(team => team.team_id === player.selected_team_id);
      setSelectedTeam(playerTeam || null);
    }
  }, [player, teams]);

  // Find the specific match by ID from URL parameter
  useEffect(() => {
    if (matchId && gameMatches.length > 0) {
      const matchIdNumber = parseInt(matchId, 10);
      const targetMatch = gameMatches.find(match => match.match_id === matchIdNumber);
      
      console.log("🎯 MatchEnd - Looking for match ID:", matchIdNumber);
      console.log("🎯 MatchEnd - Found match:", targetMatch);
      console.log("🎯 MatchEndScore - Found match:", targetMatch?.my_team_score);
      console.log("🎯 MatchEnd - All matches:", gameMatches);
      
      if (targetMatch) {
          setCurrentGameMatch(targetMatch);
          setMyTeamImage(`/teams/${targetMatch.my_team_id}.png`);
          
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

  const getResultText = () => {
    if (!currentGameMatch) return "No Match";
    
    if (currentGameMatch.my_team_score > currentGameMatch.opponent_team_score) {
      return "/matchEnd/Victory.png";
    } else if (currentGameMatch.my_team_score < currentGameMatch.opponent_team_score) {
      return "/matchEnd/Defeat.png";
    } else {
      return "/matchEnd/Victory.png";
    }
  };

  const getResultColor = () => {
    if (!currentGameMatch) return "text-gray-400";
    
    if (currentGameMatch.my_team_score > currentGameMatch.opponent_team_score) {
      return "text-green-400";
    } else if (currentGameMatch.my_team_score < currentGameMatch.opponent_team_score) {
      return "text-red-400";
    } else {
      return "text-yellow-400";
    }
  };

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
    <div 
    className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center relative overflow-hidden"
    style={{ backgroundImage: "url('/Screens/login/BackGround.png')" }}
    >
      {/* Header */}
    {/*  <div className="flex items-center justify-center mb-8"> 
        <h1 className="text-3xl font-bold text-cyan-400">Match Result</h1>
      </div> */}

      {/* Match Result */}
      <div className="max-w-2xl mx-auto">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8">
            <div className="bg-gray-900/50 border border-gray-600/30 rounded-lg p-4">
              <details className="cursor-pointer">
                <summary className="text-sm text-gray-400 hover:text-gray-300">
                  🔧 Debug Info (Development Only)
                </summary>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div>Total Matches in Store: {gameMatches.length}</div>
                  <div>Player Selected Team: {player?.selected_team_id}</div>
                  <div>Available Teams: {teams.map(t => `${t.team_id}:${t.name}`).join(', ')}</div>
                  <div className="text-cyan-400">URL Match ID: {matchId || "None"}</div>
                  <div className="text-cyan-400">Found Match: {currentGameMatch ? `Yes (ID: ${currentGameMatch.match_id})` : "No"}</div>
                  <div className="text-cyan-400">Match Status: {currentGameMatch ? getMatchStatusText(currentGameMatch.match_status) : "N/A"}</div>
                  {currentGameMatch && (
                    <div className="mt-2 p-2 bg-gray-800 rounded">
                      <div>Raw Match Data:</div>
                      <pre className="text-xs">{JSON.stringify(currentGameMatch, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        )}

        {currentGameMatch ? (
          <div className="">
            {/* Result Banner */}
            <div className="text-center">
              <div className={`text-6xl font-bold mb-4 ml-8 flex items-center justify-center ${getResultColor()}`}>
                {/* {getResultText()} */}

                <img src={getResultText()} alt="Result" className="w-full h-full" />
              </div>
            </div>

            {/* Score Display */}
            <div className="p-8 flex items-center justify-center flex-col">

            <img src={myTeamImage || ""} alt="Score" className="w-full h-full" />
            <div className="flex items-center justify-center gap-4">
              <div className="text-8xl font-bold text-cyan-400 mb-2">
                {currentGameMatch?.my_team_score}
              </div>
              <div className="text-8xl font-bold text-cyan-400">
                -
                </div>
              <div className="text-8xl font-bold text-cyan-400">
                {currentGameMatch.opponent_team_score}
                </div>
             
            </div>
            </div>

            {/* Match Stats */}
         {/*    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Match Statistics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Total Goals:</span>
                  <span className="text-green-400">{currentGameMatch.my_team_score + currentGameMatch.opponent_team_score}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Match Time:</span>
                  <span className="text-blue-400">{currentGameMatch.current_time}'</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Points Earned:</span>
                  <span className="text-yellow-400">+3</span>
                </div>
              </div>
            </div> */}

            {/* Team Points Update */}
            {/* {selectedTeam && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-green-400 font-semibold mb-2">
                    🏆 Team Points Updated!
                  </div>
                  <div className="text-sm text-gray-300">
                    {selectedTeam.name} now has <span className="text-green-400 font-bold">{selectedTeam.current_league_points}</span> league points
                  </div>
                </div>
              </div>
            )} */}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-4">
              {!matchId ? "No match ID provided" : "No match results found"}
            </div>
            
            {!matchId && (
              <div className="mb-4">
                <p className="text-red-400 text-sm mb-4">
                  No match ID provided in URL. Please play a match first.
                </p>
              </div>
            )}
          </div>
        )}


<div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20">
        <button
          onClick={() => navigate("/non-match-event-selector")}
          className="transform hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          <img 
            src="/CharacterSelection/Next Button.png" 
            alt="Next"
            className="w-32 h-18 md:w-32 md:h-16 object-contain"
          />
        </button>
      </div>
      </div>
    </div>
  );
} 