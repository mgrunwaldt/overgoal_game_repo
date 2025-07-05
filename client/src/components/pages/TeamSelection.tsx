import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../../dojo/hooks/useTeams";
import { useSelectTeamAction } from "../../dojo/hooks/useSelectTeamAction";
import useAppStore from "../../zustand/store";
import TeamSelectionItem from "../ui/teamSelection/TeamSelectionItem";
import { Loader2 } from "lucide-react";
import CyberBorder from "../ui/CyberBorder";
import gsap from "gsap";

export default function TeamSelection() {
  const navigate = useNavigate();
  const { teams, isLoading, error, refetch } = useTeams();
  const {
    executeSelectTeam,
    selectTeamState,
    error: selectError,
  } = useSelectTeamAction();
  const { player } = useAppStore();
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [teamImage, setTeamImage] = useState("/teams/1.png");

  const currentTeam = teams[currentTeamIndex];

  const getTeamImage = (teamIndex: number) => {
    let teamId = teams[teamIndex].team_id;
    return `/teams/${teamId}.png`;
  };

  useEffect(() => {
    if (teams.length > 0) {
      const currentTeamImage = getTeamImage(currentTeamIndex);
      setTeamImage(currentTeamImage);
      console.log("🎯 Current team image:", currentTeamImage);
    }
  }, [currentTeamIndex, teams]);

  useEffect(() => {
    gsap.to(".team-image", {
      opacity: 1,
      duration: 0.5,
      ease: "sine.out",
    });

    const items = gsap.utils.toArray(".stat-item");

    gsap.fromTo(
      items,
      {
        opacity: 0,
        duration: 0.3,
        stagger: 0.2,
        yPercent: -50,
        ease: "power3.out",
      },
      {
        opacity: 1,
        duration: 0.3,
        stagger: 0.2,
        yPercent: 0,
        ease: "power3.out",
      }
    );
  }, [isLoading]);

  // Auto-navigate if player already has a team selected
  useEffect(() => {
    if (player && player.selected_team_id > 0) {
      console.log("🎯 Player already has a team selected, navigating to main");
      navigate("/main", {
        state: { selectedTeamId: player.selected_team_id },
      });
    }
  }, [player, navigate]);

  const handleTeamSelect = async () => {
    if (!currentTeam) return;

    try {
      console.log(
        "🎯 Selecting team",
        currentTeam.name,
        "with ID",
        currentTeam.team_id
      );
      await executeSelectTeam(currentTeam.team_id);

      // The useEffect hook will handle navigation once the player state is updated.
    } catch (error) {
      console.error("❌ Error selecting team:", error);
    }
  };

  const handleGoBack = () => {
    navigate("/character-selection");
  };

  const nextTeam = () => {
    gsap.fromTo(
      ".team-title",
      { opacity: 0, duration: 0.7, yPercent: 50, ease: "power3.out" },
      {
        opacity: 1,
        duration: 0.3,
        yPercent: 0,
        ease: "power3.out",
      }
    );

    gsap.fromTo(
      ".team-image",
      { opacity: 0, duration: 0.5, ease: "sine.out" },
      {
        opacity: 1,
        duration: 0.3,
        ease: "sine.out",
      }
    );

    gsap.fromTo(
      ".stat-value",
      {
        opacity: 0,
        duration: 0.2,
        stagger: 0.1,
        ease: "power3.out",
      },
      {
        opacity: 1,
        stagger: 0.1,
        duration: 0.2,
        ease: "power3.out",
      }
    );

    setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
  };

  const prevTeam = () => {
    gsap.fromTo(
      ".team-title",
      { opacity: 0, duration: 0.7, yPercent: 50, ease: "power3.out" },
      {
        opacity: 1,
        duration: 0.7,
        yPercent: 0,
        ease: "power3.out",
      }
    );

    gsap.fromTo(
      ".team-image",
      { opacity: 0, duration: 0.5, ease: "sine.out" },
      {
        opacity: 1,
        duration: 0.5,
        ease: "sine.out",
      }
    );

    gsap.fromTo(
      ".stat-value",
      {
        opacity: 0,
        duration: 0.2,
        stagger: 0.1,
        ease: "power3.out",
      },
      {
        opacity: 1,
        stagger: 0.1,
        duration: 0.2,
        ease: "power3.out",
      }
    );
    setCurrentTeamIndex((prev) => (prev - 1 + teams.length) % teams.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/CharacterSelection/Background.png')",
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
            backgroundImage: "url('/CharacterSelection/Background.png')",
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
            backgroundImage: "url('/CharacterSelection/Background.png')",
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
  const isExecuting = selectTeamState === "executing";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/CharacterSelection/Background.png')",
        }}
      />

      {/* Back Button */}

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen px-4 py-4 mix-blend-normal backdrop-blur-sm">
        {/* Mobile: Team Navigation */}
        <div className="flex md:hidden items-center justify-between w-full mb-auto">
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

          <div className="text-center relative">
            <div className="text-sm text-cyan-400 mt-1 team-title">
              {currentTeamIndex + 1} / {teams.length}
            </div>

            <h2 className="text-2xl font-bold text-cyan-300 tracking-wider pb-2 team-title">
              {currentTeam?.name}
            </h2>

            <CyberBorder />
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

        {/* Mobile: Team and Stats */}
        <div className="md:hidden flex flex-col h-full mb-auto items-center justify-center space-y-6 w-full">
          {/* Team Display */}
          <div className="relative">
            <div className="relative w-64 h-64 flex items-start justify-center">
              <img
                src={teamImage}
                alt="Team"
                className="w-52 h-52 lg:w-64 lg:h-64 object-contain team-image opacity-0  drop-shadow-[0px_2px_2px_rgba(0,0,0,0.4)]"
              />

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
            <div className="stats-container">
              {/* Stats Content */}
              <div className="relative z-10 space-y-2  px-6 w-full">
                {/* Stats List */}
                <div className="space-y-4 pb-6 pt-6 stat-list">
                  <TeamSelectionItem
                    statName="OFFENSE"
                    statValue={currentTeam?.offense}
                  />
                  <TeamSelectionItem
                    statName="DEFENSE"
                    statValue={currentTeam?.defense}
                  />
                  <TeamSelectionItem
                    statName="INTENSITY"
                    statValue={currentTeam?.intensity}
                  />
                  <TeamSelectionItem
                    statName="POINTS"
                    statValue={currentTeam?.current_league_points}
                  />
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

      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20">
        <button
          onClick={handleGoBack}
          disabled={isExecuting}
          className="transform hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          <img
            src="/CharacterSelection/Back Button.png"
            alt="Back"
            className="w-32 h-18 md:w-24 md:h-12 object-contain"
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
