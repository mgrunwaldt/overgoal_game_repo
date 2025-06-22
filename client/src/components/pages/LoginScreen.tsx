import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

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
  
      // Reset navigation flag if we're back on login (user navigated back manually)
      if (location.pathname === '/login') {
        hasNavigated.current = false;
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
        
        // Set flag to prevent multiple navigations
        hasNavigated.current = true;
  

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
      }
    }
    navigationCheck();
  }, [status, playerFetched, player, playerLoading, isConnecting, navigate, location.pathname]);

  const onLoginClick = () => {
    console.log("🎯 Login button clicked!");
    console.log("📊 Current state:", { status, isConnecting });
    // Reset navigation flag on new login attempt
    hasNavigated.current = false;
    handleConnect();
  };
  
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: "url('/Screens/Log In/BackGround.png')" }}
    >
        {/* Holographic Grid Background */}
        <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
            }}></div>
        </div>

        {/* Ambient Effects */}
        <div className="fixed top-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed top-1/3 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed bottom-1/4 left-1/3 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-900/60 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-900/60 rounded-full blur-3xl animate-pulse pointer-events-none" />

    

        {/* Scanning Lines */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse delay-500"></div>

        <div className="relative z-10 flex flex-col items-center justify-between h-[500px]">
            <div className=" flex flex-col items-center justify-center mb-8 w-full">
                <img src="/Screens/Log In/Logo.png" alt="Overgoal Logo" className="w-[300px]" />
                <img src="/Screens/Log In/Title.png" alt="Overgoal Title" className="w-[350px]" />
            </div>

            <div className="w-full max-w-xs flex flex-col items-center space-y-4 mt-32 pb-8">
                <button
                    onClick={onLoginClick}
                    disabled={isConnecting || status === "connecting" || (status === "connected" && playerLoading)}
                    className="w-2/4 relative disabled:opacity-50 transition-opacity"
                >
                    <img src="/Screens/Log In/Log in Button.png" alt="Log In" />
                    {(isConnecting || status === "connecting" || (status === "connected" && playerLoading)) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-md">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
} 