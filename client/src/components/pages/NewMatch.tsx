import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { Team, useTeams } from "../../dojo/hooks/useTeams";
import { useStartGameMatchAction } from "../../dojo/hooks/useStartGameMatchAction";
import { useNavigate, useParams } from "react-router-dom";
import { Info, Clock, Users } from "lucide-react";
import useAppStore from "../../zustand/store";
import StaminaBar from "../ui/StaminaBar";
import { GameMatch } from "../../dojo/hooks/types";
import gsap from "gsap";

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
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { player } = usePlayer();
  const { teams } = useTeams();
  const { gameMatches } = useAppStore();
  const {
    execute: executeStartGameMatch,
    state: startGameMatchState,
    error: startError,
  } = useStartGameMatchAction();

  // Refs for GSAP animation
  const containerRef = useRef<HTMLDivElement>(null);
  const staminaBarRef = useRef<HTMLDivElement>(null);
  const teamsRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tl = useRef<GSAPTimeline | null>(null);

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
  const [stamina, setStamina] = useState<number>(player?.stamina || 100);
  const [enemyPlayerImage, setEnemyPlayerImage] = useState<string>(
    "/preMatch/Player 9 red.png"
  );
  const [hasAnimationFinished, setHasAnimationFinished] =
    useState<boolean>(false);

  // Animation setup
  useEffect(() => {
    if (!containerRef.current) return;

    if (!hasAnimationFinished && currentGameMatch) {
      // Set initial state
      gsap.set(
        [
          staminaBarRef.current,
          teamsRef.current,
          playersRef.current,
          infoRef.current,
          buttonRef.current,
        ],
        {
          y: -50,
          opacity: 0,
        }
      );

      // Create timeline
      tl.current = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Staggered animation
      tl.current
        .to(staminaBarRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
        })
        .to(
          teamsRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(1.5)",
          },
          "-=0.3"
        )
        .to(
          playersRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(1.3)",
          },
          "-=0.3"
        )
        .to(
          ".match-info",
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.3"
        )
        .to(
          buttonRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(0.9)",
          },
          "-=0.3"
        )
        .to(".player-item-1", {
          xPercent: 22,
          yoyo: true,
          repeat: 1,
          duration: 0.3,
          ease: "bounce.out",
        })
        .to(
          ".player-item-2",
          {
            xPercent: -22,
            repeat: 1,
            yoyo: true,
            duration: 0.3,
            ease: "bounce.out",
          },
          "<"
        );
      setHasAnimationFinished(true);
    }

    console.log("currentGameMatch", currentGameMatch);

    return () => {
      tl.current?.kill();
    };
  }, [currentGameMatch]);
  // Debug logging for component initialization
  useEffect(() => {
    console.log("🆕 [NEW_MATCH] Component initialized", {
      matchId,
      hasPlayer: !!player,
      teamsCount: teams.length,
      gameMatchesCount: gameMatches.length,
      startGameMatchState,
    });
  }, [matchId, player, teams.length, gameMatches.length, startGameMatchState]);

  // Find and set up match data
  useEffect(() => {
    console.log("🔍 [NEW_MATCH] Setting up match data", {
      matchId,
      gameMatches: gameMatches.map((m) => ({
        id: m.match_id,
        status: m.match_status,
      })),
      teams: teams.map((t) => ({ id: t.team_id, name: t.name })),
    });

    if (!matchId) {
      console.error("❌ [NEW_MATCH] No match ID provided");
      navigate("/");
      return;
    }

    const match = gameMatches.find((m) => m.match_id === parseInt(matchId));
    if (!match) {
      console.error("❌ [NEW_MATCH] Match not found", {
        matchId,
        availableMatches: gameMatches.map((m) => m.match_id),
      });
      navigate("/");
      return;
    }

    console.log("✅ [NEW_MATCH] Match found", { match });
    setCurrentGameMatch(match);

    const myTeam = teams.find((t) => t.team_id === match.my_team_id);
    const opponent = teams.find((t) => t.team_id === match.opponent_team_id);

    console.log("🏆 [NEW_MATCH] Teams resolved", {
      myTeam: myTeam ? { id: myTeam.team_id, name: myTeam.name } : null,
      opponent: opponent ? { id: opponent.team_id, name: opponent.name } : null,
    });

    if (!myTeam || !opponent) {
      console.error("❌ [NEW_MATCH] Teams not found", {
        myTeamId: match.my_team_id,
        opponentTeamId: match.opponent_team_id,
        availableTeams: teams.map((t) => ({ id: t.team_id, name: t.name })),
      });
      navigate("/");
      return;
    }

    setSelectedTeam(myTeam);
    setOpponentTeam(opponent);
  }, [matchId, gameMatches, teams, navigate]);

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
      const image = getPlayerImage(player.player_type.toString());
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

  // Handle play match (start) - NEW MATCH FLOW
  const handlePlayMatch = async () => {
    console.log("🎮 [NEW_MATCH] Play button clicked", {
      hasCurrentGameMatch: !!currentGameMatch,
      hasSelectedTeam: !!selectedTeam,
      hasOpponentTeam: !!opponentTeam,
      matchId: currentGameMatch?.match_id,
      startGameMatchState,
    });

    if (!currentGameMatch) {
      console.error("❌ [NEW_MATCH] No match found to start");
      return;
    }

    try {
      console.log("⏳ [NEW_MATCH] Starting match...");
      await executeStartGameMatch(currentGameMatch.match_id);
    } catch (error) {
      console.error("❌ [NEW_MATCH] Failed to start match:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  // Monitor state changes
  useEffect(() => {
    console.log("📊 [NEW_MATCH] State changed", {
      startGameMatchState,
      error: startError,
    });
  }, [startGameMatchState, startError]);

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
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: "url('/Screens/login/BackGround.png')" }}
    >
      <div
        ref={staminaBarRef}
        className="w-full flex justify-center items-center mb-4 opacity-0"
      >
        <StaminaBar useAnimation={false} initialStamina={stamina} />
      </div>

      <div className="flex flex-col justify-center items-center w-full h-full  ">
        <div className="flex justify-start space-y-12 flex-col h-full p-4">
          <div
            ref={teamsRef}
            className="flex flex-row space-x-2 justify-between items-center opacity-0"
          >
            <img src={myTeamImage} className="w-24 h-24" alt="My Team" />
            <img
              src="/preMatch/Vs.png"
              alt=""
              className="relative top-16 left-1 w-16 h-16 drop-shadow-[0px_2px_2px_rgba(0,255,255,0.4)]"
            />
            <img
              src={opponentTeamImage}
              alt="Opponent Team"
              className="w-24 h-24"
            />
          </div>

          <div
            ref={playersRef}
            className="flex flex-col justify-between items-center opacity-0"
          >
            <img
              className="object-contain w-32 h-20"
              src="/preMatch/Player to watch.png"
              alt=""
            />
            <div className="flex flex-row space-x-2 justify-between items-center">
              <img
                src={playerImage as string}
                className="object-contain w-40 h-40 player-item-1"
                alt=""
              />
              <img
                src={enemyPlayerImage}
                alt=""
                className="object-contain w-40 h-40 player-item-2"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Verification Panel */}
      {currentGameMatch && (
        <div className="max-w-4xl mx-auto mb-8 bg-black/60 rounded-xl opacity-0 match-info">
          <div className="bg-blue-900/20 border border-blue-500/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-400">
                Match Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex  flex-col gap-2">
                <div className="flex items-center  gap-2">
                  {" "}
                  <Users className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Teams</span>
                </div>
                <span className="text-yellow-400">
                  {selectedTeam?.name} vs {opponentTeam?.name}
                </span>
              </div>

              <div className="flex  flex-col gap-2">
                <div className="flex items-center  gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Status</span>
                </div>
                <span className="text-purple-400">
                  {getMatchStatusText(currentGameMatch.match_status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {startGameMatchState === "executing" ||
        (startGameMatchState === "success" && (
          <div className="absolute bg-black/90 mix-blend-normal backdrop-blur-normal top-0 left-0 w-full h-full flex items-center justify-center z-50">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-dashed border-blue-500 rounded-full animate-spin"></div>
              <p className="text-white text-lg mt-4">Starting match...</p>
            </div>
          </div>
        ))}

      {/* Match Setup */}
      <div className="max-w-4xl mx-auto mt-auto">
        <div className="w-full flex flex-col items-center justify-center pb-8 z-100">
          <button
            ref={buttonRef}
            onClick={handlePlayMatch}
            disabled={
              !selectedTeam ||
              !opponentTeam ||
              !currentGameMatch ||
              startGameMatchState === "executing"
            }
            className="disabled:opacity-50 disabled:cursor-not-allowed opacity-0"
          >
            {startGameMatchState === "executing" ? (
              <div className="text-white bg-black/50 rounded-lg p-4">
                Starting Match...
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
          {startError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {startError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
