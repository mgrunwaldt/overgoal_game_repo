import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useSelectTeamAction } from "../../dojo/hooks/useSelectTeamAction";
import { Team } from "../../zustand/store";
import useAppStore from "../../zustand/store";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const getTeamImage = (teamId: number) => {
   return `/teams/${teamId}.png`;
};


export default function TeamSelection() {
    const navigate = useNavigate();
  const { teams, isLoading, error, refetch } = useTeams();
  const { executeSelectTeam, selectTeamState, canSelectTeam, error: selectError } = useSelectTeamAction();
  const { player } = useAppStore();
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [teamImage, setTeamImage] = useState("/teams/1.png");

  const currentTeam = teams[currentTeamIndex];

  useEffect(() => {
    const currentTeamImage = getTeamImage(currentTeamIndex);
    setTeamImage(currentTeamImage);
    console.log("🎯 Current team image:", currentTeamImage);
  }, [currentTeamIndex]);
 

  // Auto-navigate if player already has a team selected
  useEffect(() => {
    if (player && player.selected_team_id > 0) {
      console.log("🎯 Player already has a team selected, navigating to main");
        navigate("/main");
    }
  }, [player, navigate]);

  const handleTeamSelect = async () => {
    if (!currentTeam) return;
    
    try {
      console.log("🎯 Selecting team", currentTeam.name, "with ID", currentTeam.team_id);
      await executeSelectTeam(currentTeam.team_id);
      
      // Navigate to main game after successful selection
      console.log("✅ Team selected successfully, navigating to main");
      navigate("/main");
    } catch (error) {
      console.error("❌ Error selecting team:", error);
    }
  };

  const handleGoBack = () => {
    navigate("/character-selection");
  };

  const nextTeam = () => {
    setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
  };

  const prevTeam = () => {
    setCurrentTeamIndex((prev) => (prev - 1 + teams.length) % teams.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/CharacterSelection/Background.png')"
          }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto" />
            <div className="text-cyan-300 font-bold text-xl">
              Loading Teams...
            </div>
            <div className="text-cyan-400 text-sm">
              Fetching available teams from the league
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/CharacterSelection/Background.png')"
          }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="text-red-400 font-bold text-xl mb-4">
              Error loading teams: {error}
            </div>
            <button 
              onClick={refetch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/CharacterSelection/Background.png')"
          }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="text-slate-400 font-bold text-xl mb-4">
              No teams available yet.
            </div>
            <div className="text-slate-500 text-sm">
              Teams need to be created first.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSelected = player?.selected_team_id === currentTeam?.team_id;
  const isExecuting = selectTeamState === 'executing';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/CharacterSelection/Background.png')"
        }}
      />
      
      {/* Back Button */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20">
        <button
          onClick={handleGoBack}
          disabled={isExecuting}
          className="transform hover:scale-105 transition-transform duration-200"
        >
          <img 
            src="/CharacterSelection/Back Button.png" 
            alt="Back"
            className="w-32 h-16 md:w-24 md:h-12 object-contain"
          />
        </button>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen px-4 py-8">
        
        {/* Mobile: Team Navigation */}
        <div className="flex md:hidden items-center justify-between w-full mb-6">
          <button
            onClick={prevTeam}
            disabled={isExecuting}
            className="transform hover:scale-110 transition-transform duration-200 disabled:opacity-50"
          >
            <img 
              src="/CharacterSelection/Left Arrow.png" 
              alt="Previous Team"
              className="w-12 h-12 object-contain"
            />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-300 tracking-wider">
              {currentTeam?.name}
            </h2>
            <div className="text-sm text-cyan-400 mt-1">
              {currentTeamIndex + 1} / {teams.length}
            </div>
          </div>
          
          <button
            onClick={nextTeam}
            disabled={isExecuting}
            className="transform hover:scale-110 transition-transform duration-200 disabled:opacity-50"
          >
            <img 
              src="/CharacterSelection/Right Arrow.png" 
              alt="Next Team"
              className="w-12 h-12 object-contain"
            />
          </button>
        </div>

        {/* Desktop: Full Layout */}
        <div className="hidden md:flex items-center justify-between w-full max-w-7xl">
          
          {/* Left Arrow */}
          <button
            onClick={prevTeam}
            disabled={isExecuting}
            className="transform hover:scale-110 transition-transform duration-200 disabled:opacity-50"
          >
            <img 
              src="/CharacterSelection/Left Arrow.png" 
              alt="Previous Team"
              className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
            />
          </button>

          {/* Center Content */}
          <div className="flex items-center justify-center space-x-8 lg:space-x-16">
            
            {/* Team Display */}
            <div className="relative">
              {/* Team Logo/Emblem Placeholder */}
              <div className="relative w-64 h-80 lg:w-80 lg:h-96 flex items-center justify-center">
                <img src={teamImage} alt="Team" className="w-48 h-48 lg:w-64 lg:h-64 object-contain" />
                
                {/* Loading Overlay */}
                {isExecuting && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
                      <div className="text-cyan-300 font-bold text-lg">
                        Selecting {currentTeam?.name}...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Panel */}
            <div className="relative">
              {/* Stats Background */}
              <div 
                className="relative w-64 h-80 lg:w-80 lg:h-96 bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  backgroundImage: "url('/CharacterSelection/statsContainer.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                {/* Stats Content */}
                <div className="relative z-10 space-y-4 lg:space-y-6 px-6 lg:px-8">
                  
                  {/* Team Name */}
                  <div className="text-center mb-6 lg:mb-8">
                    <h2 className="text-2xl lg:text-4xl font-bold text-cyan-300 tracking-wider">
                      {currentTeam?.name}
                    </h2>
                  </div>

                  {/* Stats List */}
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300 tracking-wider">OFFENSE</span>
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300">{currentTeam?.offense}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300 tracking-wider">DEFENSE</span>
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300">{currentTeam?.defense}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300 tracking-wider">INTENSITY</span>
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300">{currentTeam?.intensity}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300 tracking-wider">POINTS</span>
                      <span className="text-lg lg:text-2xl font-bold text-cyan-300">{currentTeam?.current_league_points}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextTeam}
            disabled={isExecuting}
            className="transform hover:scale-110 transition-transform duration-200 disabled:opacity-50"
          >
            <img 
              src="/CharacterSelection/Right Arrow.png" 
              alt="Next Team"
              className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
            />
          </button>
        </div>

        {/* Mobile: Team and Stats */}
        <div className="md:hidden flex flex-col items-center space-y-6 w-full">
          
          {/* Team Display */}
          <div className="relative">
            <div className="relative w-64 h-80 flex items-center justify-center">
              <div className="relative w-64 h-80 lg:w-80 lg:h-96 flex items-center justify-center">
                <img src={teamImage} alt="Team" className="w-48 h-48 lg:w-64 lg:h-64 object-contain" />
                
                {/* Loading Overlay */}
                {isExecuting && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
                      <div className="text-cyan-300 font-bold text-lg">
                        Selecting {currentTeam?.name}...
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Loading Overlay */}
              {isExecuting && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
                    <div className="text-cyan-300 font-bold text-lg">
                      Selecting {currentTeam?.name}...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="relative w-full max-w-sm">
            <div 
              className="relative w-full h-64 bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backgroundImage: "url('/CharacterSelection/statsContainer.png')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              {/* Stats Content */}
              <div className="relative z-10 space-y-3 px-6 w-full">
                
                {/* Stats List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-cyan-300 tracking-wider">OFFENSE</span>
                    <span className="text-3xl font-bold text-cyan-300">{currentTeam?.offense}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-cyan-300 tracking-wider">DEFENSE</span>
                    <span className="text-3xl font-bold text-cyan-300">{currentTeam?.defense}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-cyan-300 tracking-wider">INTENSITY</span>
                    <span className="text-3xl font-bold text-cyan-300">{currentTeam?.intensity}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-cyan-300 tracking-wider">POINTS</span>
                    <span className="text-3xl font-bold text-cyan-300">{currentTeam?.current_league_points}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select Button */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20">
        <button
          onClick={handleTeamSelect}
          disabled={isExecuting || isSelected}
          className="transform hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          <img 
            src="/CharacterSelection/Next Button.png" 
            alt={isSelected ? "Selected" : "Select Team"}
            className="w-32 h-18 md:w-32 md:h-16 object-contain"
          />
        </button>
      </div>

      {/* Error Display */}
      {selectError && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 px-4">
          <div className="bg-red-500/90 border border-red-400 rounded-lg p-4 max-w-md">
            <p className="text-white text-sm font-medium">{selectError}</p>
          </div>
        </div>
      )}
    </div>
  );
}