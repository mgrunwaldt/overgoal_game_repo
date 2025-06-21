import { Button } from "./ui/button";
import { useStarknetConnect } from "../dojo/hooks/useStarknetConnect";
import { useSpawnPlayer } from "../dojo/hooks/useSpawnPlayer";
import { usePlayer } from "../dojo/hooks/usePlayer";
import { useAccount } from "@starknet-react/core"
import { Loader2, Wallet, CheckCircle, LogOut, UserPlus, ExternalLink } from "lucide-react"
import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom";

export function StatusBar() {
  const {
    status,
    address,
    isConnecting,
    handleConnect,
    handleDisconnect
  } = useStarknetConnect();

  const { player, isLoading: playerLoading } = usePlayer();
  const {
    checkPlayerExists,
    isInitializing,
    txStatus,
    txHash,
    needsCharacterSelection
  } = useSpawnPlayer();


  //Hook to access the connector
  const { connector } = useAccount();

  const isConnected = status === "connected";
  const isLoading = isConnecting || status === "connecting" || isInitializing || playerLoading;

  console.log("🎯 Player: loADING NOW", player, isLoading);

  // Ref to track if we've already initiated player check
  const hasInitiatedCheck = useRef(false);

  // 🎮 Auto-check player status after connecting controller
  useEffect(() => {
    if (isConnected && !isInitializing && !playerLoading && !hasInitiatedCheck.current) {
      console.log("🎮 Controller connected, checking player status...");
      hasInitiatedCheck.current = true;
      
      setTimeout(() => {
        checkPlayerExists().then(result => {
          console.log("🎮 Player check result:", result);
          
          // NOTE: Navigation is now handled by LoginScreen and App routing
          // Removing auto-navigation from status bar to avoid conflicts
          
          // Reset the ref if check failed so we can retry
          if (!result.success) {
            hasInitiatedCheck.current = false;
          }
        }).catch(() => {
          // Reset the ref on error so we can retry
          hasInitiatedCheck.current = false;
        });
      }, 500);
    }
    
    // Reset the ref if we lose connection or player status changes
    if (!isConnected) {
      hasInitiatedCheck.current = false;
    }
  }, [isConnected, isInitializing, playerLoading, checkPlayerExists]);

  // Reset check flag when player data becomes available
  useEffect(() => {
    if (player) {
      hasInitiatedCheck.current = false;
    }
  }, [player]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-400/30">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <span className="text-cyan-300 font-medium">
          {isConnecting || status === "connecting" ? "Connecting..." : 
           isInitializing ? "Checking player..." : 
           "Loading..."}
        </span>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4 bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50">
        <div className="flex items-center space-x-3">
          <Wallet className="h-5 w-5 text-slate-400" />
          <span className="text-slate-300 font-medium">Controller Not Connected</span>
        </div>
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          variant="outline"
          size="sm"
          className="bg-cyan-500/20 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Connect Controller
            </>
          )}
        </Button>
      </div>
    );
  }

  // Connected state
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4 bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-400/30">
      {/* Status Info */}
      <div className="flex items-center space-x-3">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <div className="flex flex-col">
          <span className="text-cyan-300 font-medium">Controller Connected</span>
          <span className="text-xs text-slate-400 font-mono">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </span>
        </div>
      </div>

      {/* Player Status */}
      <div className="flex items-center space-x-3">
        {player ? (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-green-400">✓</span>
            <span className="text-cyan-300">Player Active</span>
          </div>
        ) : needsCharacterSelection ? (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-yellow-400">⚠</span>
            <span className="text-yellow-300">Character Selection Required</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-orange-400">●</span>
            <span className="text-orange-300">Checking Player...</span>
          </div>
        )}
      </div>

      {/* Transaction Status */}
      {txHash && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Transaction:</span>
          <a
            href={`https://sepolia.starkscan.co/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            <span>{txStatus}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {connector?.id === "cartridge" && (
          <Button
            onClick={() => window.open("https://cartridge.gg/inventory", "_blank")}
            variant="outline"
            size="sm"
            className="bg-purple-500/20 border-purple-400/50 text-purple-300 hover:bg-purple-500/30"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Inventory
          </Button>
        )}
        
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="bg-red-500/20 border-red-400/50 text-red-300 hover:bg-red-500/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    </div>
  );
}
