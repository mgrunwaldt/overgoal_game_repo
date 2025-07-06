import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { useAccount } from "@starknet-react/core"
import useAppStore from "../zustand/store"
import { useTeams } from "../dojo/hooks/useTeams"
import { Coins, Zap, Heart, Loader2, AlertTriangle, Target, Gamepad2, Battery, Dumbbell, Star, Trophy, Users } from "lucide-react"

export function PlayerStats() {
  const { status } = useAccount();
  const player = useAppStore(state => state.player);
  const isLoading = useAppStore(state => state.isLoading);
  
  // 🎯 NEW: Fetch team data to show league points
  const { teams } = useTeams();

  const isConnected = status === "connected";

  console.log("🎯 player stats", player);

  // 🎯 NEW: Find the player's selected team
  const selectedTeam = player && teams.length > 0 
    ? teams.find(team => team.team_id === player.selected_team_id)
    : null;

  // Use real player data or default values
  const stats = [
          {
        label: "Experience",
        value: player?.experience || 0,
        color: "text-blue-400",
        icon: Dumbbell
      },
          {
        label: "Health",
        value: player?.health || 100,
        color: getHealthColor(player?.health || 100),
        icon: Heart,
        max: 100
      },
    {
      label: "Coins",
      value: player?.coins || 0,
      color: "text-yellow-400",
      icon: Coins
    },
    {
      label: "Shooting",
      value: player?.shoot || 10,
      color: "text-red-400",
      icon: Target
    },
    {
      label: "Energy",
      value: player?.energy || 40,
      color: "text-green-400",
      icon: Zap
    },
    {
      label: "Stamina",
      value: player?.stamina || 40,
      color: "text-blue-400",
      icon: Battery
    },
    {
      label: "Charisma",
      value: player?.charisma || 10,
      color: "text-pink-400",
      icon: Heart
    },
    {
      label: "Dribbling",
      value: player?.dribble || 10,
      color: "text-purple-400",
      icon: Gamepad2
    },
    {
      label: "Fame",
      value: player?.fame || 10,
      color: "text-orange-400",
      icon: Star
    },
  ];

  // Function to get health color based on value
  function getHealthColor(health: number): string {
    if (health >= 80) return "text-green-400";
    if (health >= 50) return "text-yellow-400";
    if (health >= 20) return "text-orange-400";
    return "text-red-400";
  }

  // Calculate experience for level up (example: every 100 exp = 1 level)
  const currentLevel = Math.floor((player?.experience || 0) / 100) + 1;
  const expInCurrentLevel = (player?.experience || 0) % 100;
  const expNeededForNextLevel = 100;

  if (isLoading || !player) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl font-bold">Player Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading player data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-xl font-bold">Player Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 🎯 NEW: Team info section */}
        {selectedTeam && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-medium">Team</span>
              </div>
              <span className="text-cyan-400 font-bold">{selectedTeam.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300">League Points</span>
              </div>
              <span className="text-yellow-400 font-bold text-lg">{selectedTeam.current_league_points}</span>
            </div>
          </div>
        )}

        {/* Main stats */}
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{stat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                                  <span className={`font-bold text-lg ${stat.color}`}>
                    {stat.value}
                    {stat.max && `/${stat.max}`}
                  </span>
                {/* Low health indicator */}
                {stat.label === "Health" && stat.value <= 20 && (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          );
        })}

        {/* Experience bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Level {currentLevel}</span>
            <span className="text-blue-400 font-bold">
              {expInCurrentLevel} / {expNeededForNextLevel}
            </span>
          </div>
          <Progress
            value={(expInCurrentLevel / expNeededForNextLevel) * 100}
            className="h-2 bg-slate-700"
          />
        </div>

        {/* Health bar */}
        {player && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Health Status</span>
              <span className={`font-bold text-sm ${getHealthColor(player.health)}`}>
                {player.health >= 80 ? "Excellent" :
                  player.health >= 50 ? "Good" :
                    player.health >= 20 ? "Poor" : "Critical"}
              </span>
            </div>
            <Progress
              value={player.health}
              className={`h-2 ${player.health >= 50 ? "bg-slate-700" : "bg-red-900/30"
                }`}
            />
          </div>
        )}

        {/* Connection states */}
        {!isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <Coins className="w-4 h-4" />
              <span>Connect controller to load real player stats</span>
            </div>
          </div>
        )}

        {isConnected && !player && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Zap className="w-4 h-4" />
              <span>Creating your player automatically...</span>
            </div>
          </div>
        )}

        {isConnected && player && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Heart className="w-4 h-4" />
              <span>Player ready! Use actions to train and progress.</span>
            </div>
          </div>
        )}

        {/* 🎯 NEW: Team points info */}
        {selectedTeam && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <Trophy className="w-4 h-4" />
              <span>Win matches to earn team points! (Win: +3, Draw: +1, Loss: +0)</span>
            </div>
          </div>
        )}

        {/* Low health warning */}
        {player && player.health <= 20 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>⚠️ Low health! Rest to recover before mining.</span>
            </div>
          </div>
        )}

        {/* Low stamina warning */}
        {player && player.stamina <= 10 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Battery className="w-4 h-4" />
              <span>⚡ Low stamina! Restore stamina to train skills.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}