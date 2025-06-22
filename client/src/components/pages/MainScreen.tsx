import { useEffect, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useCreateGameMatchAction } from "../../dojo/hooks/useCreateGameMatchAction";
import { LogOut, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAppStore from "../../zustand/store";

export default function MainScreen() {
    const navigate = useNavigate();
    const [playerStats, setPlayerStats] = useState({
        stamina: 0,
        energy: 0,
        charisma: 0,
        dribble: 0,
        fame: 0,
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
        error: matchError 
    } = useCreateGameMatchAction();

    // Find the player's selected team
    const selectedTeam = teams.find(team => team.team_id === player?.selected_team_id);

  useEffect(() => {
    console.log("🎯 MainScreen rendered");
    if(playerLoading === false && player !== null){
        setPlayerStats({
            stamina: player.stamina,
            energy: player.energy,
            charisma: player.charisma,
            dribble: player.dribble,
            fame: player.fame,
        });
    }
  }, [playerLoading, player]);


  // Handle new match creation
  const handleNewMatch = async () => {
    if (!player || !selectedTeam || teams.length < 2) {
      console.error("Cannot create match: missing player, selected team, or not enough teams");
      return;
    }

    // Find an opponent team (any team that's not the player's selected team)
    const opponentTeam = teams.find(team => team.team_id !== player.selected_team_id);
    if (!opponentTeam) {
      console.error("Cannot create match: no opponent team found");
      return;
    }

    // Generate a unique match ID (simple timestamp-based for now)
    const matchId = Date.now() % 1000000; // Keep it reasonable for u32

    try {
      console.log("🎮 Creating new match...");
      await executeCreateGameMatch(matchId, selectedTeam.team_id, opponentTeam.team_id);
      
      // Navigate to NewMatch screen after successful creation
      if (createGameMatchState === 'success') {
        navigate("/new-match");
      }
    } catch (error) {
      console.error("Failed to create match:", error);
    }
  };

  // Navigate to NewMatch when match creation is successful
  useEffect(() => {
    if (createGameMatchState === 'success') {
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

  return <div className="flex flex-col items-center justify-center h-screen">
   

   <div className="flex flex-row items-center justify-center">
    <button className="rounded-full bg-red-500 p-3 text-white text-center" onClick={() => {
      handleDisconnect();
      navigate("/login", { replace: true });
    }}><LogOut size={20} /></button>
   </div> 
   
    <div>
      <h1>Stamina: {playerStats.stamina} </h1>
      <h1>Energy: {playerStats.energy} </h1>
      <h1>Charisma: {playerStats.charisma} </h1>
      <h1>Dribble: {playerStats.dribble} </h1>
      <h1>Fame: {playerStats.fame} </h1>
      <h1>Team: {selectedTeam?.name || player?.selected_team_id || "None"} </h1>
      <h1>Team Points: {selectedTeam?.current_league_points || 0} </h1>
    </div>

    {/* Error display */}
    {matchError && (
      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {matchError}
      </div>
    )}

    {/* New Match Button */}
    <div className="mt-8">
      <button
        onClick={handleNewMatch}
        disabled={!canCreateGameMatch || isCreatingMatch || !selectedTeam || teams.length < 2}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
          canCreateGameMatch && !isCreatingMatch && selectedTeam && teams.length >= 2
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-slate-600 text-slate-400 cursor-not-allowed"
        }`}
      >
        {isCreatingMatch ? (
          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <Play size={20} />
        )}
        {isCreatingMatch ? "Creating Match..." : "New Match"}
      </button>
    </div>


  
 
  
  </div>;
}   