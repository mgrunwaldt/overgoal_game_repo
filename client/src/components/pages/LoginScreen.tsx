import { Button } from "../ui/button";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { Loader2, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { useEffect } from "react";

export default function LoginScreen() {
  const {
    status,
    isConnecting,
    handleConnect,
  } = useStarknetConnect();
  
  const navigate = useNavigate();
  const { account } = useAccount();
  
  const isConnected = status === "connected";
  
  // Redirect to game when connected
  useEffect(() => {
    if (isConnected && account) {
      navigate("/game");
    }
  }, [isConnected, account, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center space-y-8">
          {/* Logo/Title Section */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              OVERGOAL
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 font-light">
              More than a match
            </p>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
              Enter the ultimate football universe where every match shapes your legacy. 
              Train your skills, build your reputation, and become a legend.
            </p>
          </div>

          {/* Join Game Button */}
          <div className="pt-8">
            <Button
              onClick={handleConnect}
              disabled={isConnecting || status === "connecting"}
              className="px-12 py-6 text-xl font-bold transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-2xl shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {(isConnecting || status === "connecting") ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Gamepad2 className="w-6 h-6 mr-3" />
                  Join Game
                </>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-12 text-center">
            <p className="text-sm text-slate-500">
              Powered by Dojo & Starknet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 