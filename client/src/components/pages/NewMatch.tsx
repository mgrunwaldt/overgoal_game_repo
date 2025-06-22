import { useEffect, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useSimulateGameMatchAction } from "../../dojo/hooks/useSimulateGameMatchAction";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Info, Hash, Clock, Users } from "lucide-react";
import useAppStore from "../../zustand/store";
import type { Team, GameMatch, MatchStatus } from "../../zustand/store";





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

  useEffect(() => {
    if (player && teams.length > 0) {
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
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/main")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-cyan-400">New Match</h1>
        <div></div>
      </div>

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

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-4xl mx-auto mb-8">
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
                <div className="text-yellow-400">Simulate State: {simulateGameMatchState}</div>
                <div className="text-yellow-400">Can Simulate: {canSimulateGameMatch.toString()}</div>
                <div className="text-yellow-400">Is Simulating: {isSimulating.toString()}</div>
                {simulateError && <div className="text-red-400">Error: {simulateError}</div>}
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

      {/* Error display */}
      {simulateError && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
            {simulateError}
          </div>
        </div>
      )}

      {/* Match Setup */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Team 1 - Player's Team */}
          <div className="bg-slate-800 rounded-lg p-6 border-2 border-cyan-400">
            <h2 className="text-xl font-semibold mb-4 text-center text-cyan-400">Team 1</h2>
            {selectedTeam ? (
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">{selectedTeam.name}</h3>
                <div className="text-xs text-gray-400 mb-2">ID: {selectedTeam.team_id}</div>
                <div className="space-y-1 text-sm">
                  <div>Offense: {selectedTeam.offense}</div>
                  <div>Defense: {selectedTeam.defense}</div>
                  <div>Intensity: {selectedTeam.intensity}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <p>No team selected</p>
                <button
                  onClick={() => navigate("/select-team")}
                  className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
                >
                  Select Team
                </button>
              </div>
            )}
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">VS</div>
            {currentGameMatch && (
              <div className="text-xs text-gray-400 mt-2">
                Match #{currentGameMatch.match_id}
              </div>
            )}
          </div>

          {/* Team 2 - Opponent */}
          <div className="bg-slate-800 rounded-lg p-6 border-2 border-red-400">
            <h2 className="text-xl font-semibold mb-4 text-center text-red-400">Team 2</h2>
            {opponentTeam ? (
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">{opponentTeam.name}</h3>
                <div className="text-xs text-gray-400 mb-2">ID: {opponentTeam.team_id}</div>
                <div className="space-y-1 text-sm">
                  <div>Offense: {opponentTeam.offense}</div>
                  <div>Defense: {opponentTeam.defense}</div>
                  <div>Intensity: {opponentTeam.intensity}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <p>No opponent available</p>
              </div>
            )}
          </div>
        </div>

        {/* Match Result */}
        <div className="text-center mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Match Result</h2>
          <div className="text-3xl font-bold text-cyan-400">
            <span>{selectedTeam?.name || "Team 1"}: {currentGameMatch?.my_team_score || 0}</span>
            <span className="mx-4 text-white">-</span>
            <span>{opponentTeam?.name || "Team 2"}: {currentGameMatch?.opponent_team_score || 0}</span>
          </div>
        </div>

        {/* Play Match Button */}
        <div className="text-center mt-8">
          <button
            onClick={handlePlayMatch}
            disabled={!selectedTeam || !opponentTeam || !currentGameMatch || !canSimulateGameMatch || isSimulating}
            className={`px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-3 mx-auto transition-colors ${
              selectedTeam && opponentTeam && currentGameMatch && canSimulateGameMatch && !isSimulating
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-600 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSimulating ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Play size={24} />
            )}
            {isSimulating ? "Simulating Match..." : currentGameMatch ? "Play Match" : "Loading Match..."}
          </button>
          
          {!currentGameMatch && (
            <p className="text-sm text-gray-400 mt-2">
              {!matchId ? "No match ID provided" : "Waiting for match to be loaded..."}
            </p>
          )}
        </div>

        {!matchId && (
          <div className="text-center mt-4">
            <p className="text-red-400 text-sm mb-4">
              No match ID provided. Please create a match first.
            </p>
            <button
              onClick={() => navigate("/main")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Back to Main
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 