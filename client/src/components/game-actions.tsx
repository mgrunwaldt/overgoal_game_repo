import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dumbbell, Hammer, Bed, Loader2, ExternalLink, Target, Gamepad2, Zap, Battery, Heart, Star } from "lucide-react";
import { useTrainAction } from "../dojo/hooks/useTrainAction";
import { useMineAction } from "../dojo/hooks/useMineAction";
import { useRestAction } from "../dojo/hooks/useRestAction";
import { useTrainShootingAction } from "../dojo/hooks/useTrainShootingAction";
import { useTrainEnergyAction } from "../dojo/hooks/useTrainEnergyAction";
import { useTrainDribblingAction } from "../dojo/hooks/useTrainDribblingAction";
import { useRestoreStaminaAction } from "../dojo/hooks/useRestoreStaminaAction";
import { useImproveCharismaAction } from "../dojo/hooks/useImproveCharismaAction";
import { useImproveFameAction } from "../dojo/hooks/useImproveFameAction";
import useAppStore from "../zustand/store";

export function GameActions() {
  const player = useAppStore((state) => state.player);

  // Separate hooks for each action
  const { trainState, executeTrain, canTrain } = useTrainAction();
  const { mineState, executeMine, canMine } = useMineAction();
  const { restState, executeRest, canRest } = useRestAction();
  const { trainShootingState, executeTrainShooting, canTrainShooting } = useTrainShootingAction();
  const { trainEnergyState, executeTrainEnergy, canTrainEnergy } = useTrainEnergyAction();
  const { trainDribblingState, executeTrainDribbling, canTrainDribbling } = useTrainDribblingAction();
  const { restoreStaminaState, executeRestoreStamina, canRestoreStamina } = useRestoreStaminaAction();
  const { improveCharismaState, executeImproveCharisma, canImproveCharisma } = useImproveCharismaAction();
  const { improveFameState, executeImproveFame, canImproveFame } = useImproveFameAction();

  const actions = [
    {
      icon: Dumbbell,
      label: "Train",
      description: "+10 EXP",
      onClick: executeTrain,
      color: "from-blue-500 to-blue-600",
      state: trainState,
      canExecute: canTrain,
    },
    {
      icon: Target,
      label: "Train Shooting",
      description: "+5 Shooting, +5 EXP",
      onClick: executeTrainShooting,
      color: "from-red-500 to-red-600",
      state: trainShootingState,
      canExecute: canTrainShooting,
    },
    {
      icon: Zap,
      label: "Train Energy",
      description: "+5 Energy, -10 Stamina",
      onClick: executeTrainEnergy,
      color: "from-yellow-500 to-yellow-600",
      state: trainEnergyState,
      canExecute: canTrainEnergy,
    },
    {
      icon: Gamepad2,
      label: "Train Dribbling",
      description: "+5 Dribbling, +5 EXP",
      onClick: executeTrainDribbling,
      color: "from-purple-500 to-purple-600",
      state: trainDribblingState,
      canExecute: canTrainDribbling,
    },
    {
      icon: Hammer,
      label: "Mine",
      description: "+5 Coins, -5 Health",
      onClick: executeMine,
      color: "from-yellow-500 to-yellow-600",
      state: mineState,
      canExecute: canMine,
      disabledReason:
        !canMine && player && (player.health || 0) <= 5
          ? "Low Health!"
          : undefined,
    },
    {
      icon: Bed,
      label: "Rest",
      description: "+20 Health",
      onClick: executeRest,
      color: "from-green-500 to-green-600",
      state: restState,
      canExecute: canRest,
      disabledReason:
        !canRest && player && (player.health || 0) >= 100
          ? "Full Health!"
          : undefined,
    },
    {
      icon: Battery,
      label: "Restore Stamina",
      description: "+20 Stamina",
      onClick: executeRestoreStamina,
      color: "from-purple-500 to-purple-600",
      state: restoreStaminaState,
      canExecute: canRestoreStamina,
      disabledReason:
        !canRestoreStamina && player && (player.stamina || 0) >= 100
          ? "Full Stamina!"
          : undefined,
    },
    {
      icon: Heart,
      label: "Improve Charisma",
      description: "+5 Charisma, -5 Stamina",
      onClick: executeImproveCharisma,
      color: "from-pink-500 to-pink-600",
      state: improveCharismaState,
      canExecute: canImproveCharisma,
      disabledReason:
        !canImproveCharisma && player && (player.stamina || 0) <= 5
          ? "Low Stamina!"
          : !canImproveCharisma && player && (player.charisma || 0) >= 100
          ? "Full Charisma!"
          : undefined,
    },
    {
      icon: Star,
      label: "Improve Fame",
      description: "+5 Fame, +5 Charisma",
      onClick: executeImproveFame,
      color: "from-orange-500 to-orange-600",
      state: improveFameState,
      canExecute: canImproveFame,
      disabledReason:
        !canImproveFame && player && (player.fame || 0) >= 100
          ? "Full Fame!"
          : undefined,
    },
  ];

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-xl font-bold">
          Game Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!player && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <div className="text-yellow-400 text-sm text-center">
              🎮 Connect controller and create player to unlock actions
            </div>
          </div>
        )}

        {actions.map((action) => {
          const Icon = action.icon;
          const isLoading = action.state.isLoading;
          const hasError = Boolean(action.state.error);

          return (
            <div key={action.label} className="space-y-2">
              <Button
                onClick={action.onClick}
                disabled={!action.canExecute || isLoading}
                className={`w-full h-14 bg-gradient-to-r ${action.color} hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 mr-3" />
                )}
                <div className="flex flex-col items-start flex-1">
                  <span className="font-semibold">{action.label}</span>
                  <span className="text-xs opacity-80">
                    {action.description}
                  </span>
                </div>
                {action.disabledReason && (
                  <span className="text-xs opacity-60">
                    {action.disabledReason}
                  </span>
                )}
              </Button>

              {/* Individual transaction state */}
              {(action.state.txStatus || hasError) && (
                <div
                  className={`p-3 rounded-lg border text-sm ${hasError
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : action.state.txStatus === "SUCCESS"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    }`}
                >
                  {hasError ? (
                    `❌ Error: ${action.state.error}`
                  ) : action.state.txStatus === "SUCCESS" ? (
                    <div className="space-y-2">
                      <div>✅ {action.label} completed successfully!</div>
                      {action.state.txHash && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono bg-black/20 px-2 py-1 rounded">
                            {formatAddress(action.state.txHash)}
                          </span>
                          <a
                            href={`https://sepolia.starkscan.co/tx/${action.state.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            StarkScan
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        ⏳ {action.label} processing...
                      </div>
                      {action.state.txHash && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono bg-black/20 px-2 py-1 rounded">
                            {formatAddress(action.state.txHash)}
                          </span>
                          <a
                            href={`https://sepolia.starkscan.co/tx/${action.state.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Live
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
