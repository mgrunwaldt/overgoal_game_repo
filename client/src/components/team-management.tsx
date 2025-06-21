import { useState } from "react";
import { Users, Trophy, Zap, Shield, Target, Plus, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useCreateTeamAction } from "../dojo/hooks/useCreateTeamAction";
import { useTeams } from "../dojo/hooks/useTeams";
import useAppStore from "../zustand/store";

export default function TeamManagement() {
  const { selectedTeam, setSelectedTeam } = useAppStore();
  const { createTeamState, executeCreateTeam, canCreateTeam, isLoading: isCreating, error: createError } = useCreateTeamAction();
  const { teams, isLoading: isFetching, error: fetchError, refetch } = useTeams();

  // Form state
  const [formData, setFormData] = useState({
    teamId: '',
    name: '',
    offense: 50,
    defense: 50,
    intensity: 50,
  });

  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.teamId) {
      return;
    }

    await executeCreateTeam(
      parseInt(formData.teamId),
      formData.name,
      formData.offense,
      formData.defense,
      formData.intensity
    );

    // Reset form on success and refetch teams
    if (createTeamState === 'success') {
      setFormData({
        teamId: '',
        name: '',
        offense: 50,
        defense: 50,
        intensity: 50,
      });
      setShowForm(false);
      
      // Refetch teams after successful creation
      setTimeout(() => {
        refetch();
      }, 1000); // Small delay to ensure blockchain state is updated
    }
  };

  const handleRefresh = async () => {
    console.log("🔄 Manually refreshing teams...");
    await refetch();
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'executing':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTeamStrength = (team: any) => {
    return team.offense + team.defense + team.intensity;
  };

  const getTeamRating = (strength: number) => {
    if (strength >= 240) return { label: "Elite", color: "text-purple-400" };
    if (strength >= 200) return { label: "Strong", color: "text-green-400" };
    if (strength >= 150) return { label: "Average", color: "text-yellow-400" };
    return { label: "Weak", color: "text-red-400" };
  };

  // Display any errors
  const displayError = createError || fetchError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          {isFetching && (
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isFetching}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setShowForm(!showForm)}
            disabled={!canCreateTeam}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{displayError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Form */}
      {showForm && (
        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Team</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team ID and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team ID
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.teamId}
                  onChange={(e) => handleInputChange('teamId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter unique team ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                  required
                />
              </div>
            </div>

            {/* Stats Sliders */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Target className="w-4 h-4 text-red-400" />
                  Offense: {formData.offense}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.offense}
                  onChange={(e) => handleInputChange('offense', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Defense: {formData.defense}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.defense}
                  onChange={(e) => handleInputChange('defense', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Intensity: {formData.intensity}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.intensity}
                  onChange={(e) => handleInputChange('intensity', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Total Stats */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Strength:</span>
                <span className="font-bold text-white">
                  {formData.offense + formData.defense + formData.intensity}/300
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!canCreateTeam || isCreating || !formData.name.trim() || !formData.teamId}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                {getStateIcon(createTeamState)}
                {isCreating ? "Creating..." : "Create Team"}
              </Button>
              
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Teams List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            All Teams ({teams.length})
          </h3>
          
          {teams.length > 0 && (
            <div className="text-sm text-gray-400">
              Showing teams from blockchain
            </div>
          )}
        </div>
        
        {isFetching ? (
          <Card className="bg-gray-800/50 border-gray-700 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading teams from blockchain...</p>
          </Card>
        ) : teams.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700 p-8 text-center">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No teams found</p>
            <p className="text-sm text-gray-500">Create your first team to get started!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const strength = getTeamStrength(team);
              const rating = getTeamRating(strength);
              const isSelected = selectedTeam?.team_id === team.team_id;

              return (
                <Card
                  key={team.team_id}
                  className={`bg-gray-800/50 border-gray-700 p-4 cursor-pointer transition-all hover:bg-gray-700/50 ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''
                  }`}
                  onClick={() => setSelectedTeam(isSelected ? null : team)}
                >
                  <div className="space-y-3">
                    {/* Team Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{team.name}</h4>
                      <span className="text-xs text-gray-400">ID: {team.team_id}</span>
                    </div>

                    {/* Team Rating */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${rating.color}`}>
                        {rating.label}
                      </span>
                      <span className="text-sm text-gray-400">
                        {strength}/300
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="w-3 h-3 text-red-400" />
                          <span className="text-gray-300">Offense</span>
                        </div>
                        <span className="text-white font-medium">{team.offense}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3 text-blue-400" />
                          <span className="text-gray-300">Defense</span>
                        </div>
                        <span className="text-white font-medium">{team.defense}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-gray-300">Intensity</span>
                        </div>
                        <span className="text-white font-medium">{team.intensity}</span>
                      </div>
                    </div>

                    {/* League Points */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-600">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3 h-3 text-yellow-400" />
                        <span className="text-gray-300">League Points</span>
                      </div>
                      <span className="text-white font-medium">{team.current_league_points}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 