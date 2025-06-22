import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function LoginScreen() {
  const {
    status,
    isConnecting,
    handleConnect,
  } = useStarknetConnect();
  
  const { player, isLoading: playerLoading ,playerFetched } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ref to prevent multiple navigation attempts
  const hasNavigated = useRef(false);
  
  // Loading state for post-connection flow
  const [isPostConnectionLoading, setIsPostConnectionLoading] = useState(false);

  // Handle navigation after successful connection
  useEffect(() => {
    const navigationCheck = async () => {
      console.log("🔄 LoginScreen Navigation Check:", {
        status,
        playerLoading,
        player: !!player,
        isConnecting,
        currentPath: location.pathname,
        hasNavigated: hasNavigated.current
      });
  
      // Reset navigation flag and loading state if we're back on login (user navigated back manually)
      if (location.pathname === '/login') {
        hasNavigated.current = false;
        setIsPostConnectionLoading(false);
      }

  
      // Only proceed if:
      // 1. Wallet is connected 
      // 2. Not currently connecting or loading
      // 3. Haven't already navigated
      // 4. Currently on login page
      if (status === "connected" && 
          !isConnecting && 
          !playerLoading && 
          !hasNavigated.current &&
          location.pathname === '/login') {
        
        console.log("✅ Wallet connected, checking player status...");
        
        // Set flag to prevent multiple navigations and show loading
        hasNavigated.current = true;
        setIsPostConnectionLoading(true);
  
        try {
          // Current wait for fetching plater data from the contract
          console.log("🎯 waiting for 3 seconds");
          await new Promise(resolve => setTimeout(resolve, 3000));
          console.log("🎯 3 seconds passed");
         
          console.log("🎯 player", player);

          if (player) {
            console.log("🎮 setting -player");
            navigate("/main", { replace: true });
          } else {
            console.log("👤 setting - else");
            navigate("/character-selection", { replace: true });
          }
        } finally {
          setIsPostConnectionLoading(false);
        }
      }
    }
    navigationCheck();
  }, [status, playerFetched, player, playerLoading, isConnecting, navigate, location.pathname]);

  const onLoginClick = () => {
    console.log("🎯 Login button clicked!");
    console.log("📊 Current state:", { status, isConnecting });
    // Reset navigation flag and loading state on new login attempt
    hasNavigated.current = false;
    setIsPostConnectionLoading(false);
    handleConnect();
  };
  
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: "url('/Screens/login/BackGround.png')" }}
    >
        {/* Holographic Grid Background */}
        <div className="absolute inset-0 opacity-80">
            <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
            }}></div>
        </div>

        {/* Ambient Effects */}
        <div className="fixed top-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-cyan-500/40 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed top-1/3 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-500/80 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed bottom-1/4 left-1/3 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-500/60 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-600/90 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-600/90 rounded-full blur-3xl animate-pulse pointer-events-none" />

    

        {/* Scanning Lines */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse delay-500"></div>

        <div className="relative z-10 flex flex-col items-center justify-between h-[500px]">
            <div className=" flex flex-col items-center justify-center mb-8 w-full">
                <img src="/Screens/login/Logo.png" alt="Overgoal Logo" className="w-[300px]" />
                <img src="/Screens/login/Title.png" alt="Overgoal Title" className="w-[350px]" />
            </div>

            <div className="w-full max-w-xs flex flex-col items-center space-y-4 mt-32 pb-8">
                <button
                    onClick={onLoginClick}
                    disabled={isConnecting || status === "connecting" || isPostConnectionLoading}
                    className="w-2/4 relative disabled:opacity-50 transition-opacity"
                >
                    <img src="/Screens/login/LoginInButton.png" alt="LogIn" />
                    {(isConnecting || status === "connecting") && !isPostConnectionLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-md">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        </div>
                    )}
                </button>
            </div>
        </div>

        {/* Post-Connection Loading Overlay */}
        {isPostConnectionLoading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center space-y-6">
              <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto" />
              <div className="text-cyan-300 font-bold text-xl">
                Connecting to Game...
              </div>
              <div className="text-cyan-400 text-sm max-w-md">
                Initializing your player data and preparing the game environment
              </div>
              
              {/* Animated Progress Dots */}
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-200"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-400"></div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
} 
