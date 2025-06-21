import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useSelectTeamAction } from "../../dojo/hooks/useSelectTeamAction";
import { Team } from "../../zustand/store";
import useAppStore from "../../zustand/store";
import { Loader2 } from "lucide-react";

function TeamCard({ team }: { team: Team }) {
    const navigate = useNavigate();
    const { executeSelectTeam, selectTeamState, canSelectTeam, error } = useSelectTeamAction();
    const { player } = useAppStore();

    const handleSelect = async () => {
        try {
            console.log("🎯 Selecting team", team.name, "with ID", team.team_id);
            await executeSelectTeam(team.team_id);
            
            // Navigate to main game after successful selection
            if (selectTeamState === 'success') {
                console.log("✅ Team selected successfully, navigating to main");
                navigate("/main");
            }
        } catch (error) {
            console.error("❌ Error selecting team:", error);
        }
    };

    const isSelected = player?.selected_team_id === team.team_id;
    const isExecuting = selectTeamState === 'executing';

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-lg m-2 w-1/4 text-white transition-all duration-300 ${
      isSelected ? 'bg-green-700 border-2 border-green-400' : 'bg-gray-800 hover:bg-gray-700'
    }`}>
      <h1 className="text-xl font-bold mb-2">{team.name}</h1>
      <div className="space-y-1 text-sm">
        <p>Offense: {team.offense}</p>
        <p>Defense: {team.defense}</p>
        <p>Intensity: {team.intensity}</p>
        <p>League Points: {team.current_league_points}</p>
      </div>
      
      {error && (
        <div className="text-red-400 text-xs mt-2 text-center">
          {error}
        </div>
      )}
      
      <button 
        className={`text-white p-2 rounded-lg mt-3 min-w-[100px] transition-all duration-300 ${
          isSelected 
            ? 'bg-green-600 cursor-default' 
            : canSelectTeam && !isExecuting
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-500 cursor-not-allowed'
        }`}
        onClick={handleSelect}
        disabled={!canSelectTeam || isExecuting || isSelected}
      >
        {isExecuting ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Selecting...
          </div>
        ) : isSelected ? (
          'Selected ✓'
        ) : (
          'Select'
        )}
      </button>
    </div>
  );
}


export default function TeamSelection() {
  const navigate = useNavigate();
  const { teams, isLoading, error, refetch } = useTeams();
  const { player } = useAppStore();

  // Auto-navigate if player already has a team selected
  useEffect(() => {
    if (player && player.selected_team_id > 0) {
      console.log("🎯 Player already has a team selected, navigating to main");
      navigate("/main");
    }
  }, [player, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-200">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading teams: {error}</p>
          <button 
            onClick={refetch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log("🎯 teams", teams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            SELECT YOUR TEAM
          </h1>
          <p className="text-cyan-200/80 text-lg">
            Choose a team to represent in your football journey
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {teams.map((team) => (
            <TeamCard key={team.team_id} team={team} />
          ))}
        </div>
        
        {teams.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-slate-400 mb-4">No teams available yet.</p>
            <p className="text-slate-500 text-sm">Teams need to be created first.</p>
          </div>
        )}
      </div>
    </div>
  );
}