import { Button } from "../ui/button";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { usePlayer } from "../../dojo/hooks/usePlayer";
import { Loader2, Gamepad2, LogIn } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      {/* Square Geometric Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(0, 255, 255, 0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(0, 255, 255, 0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(0, 255, 255, 0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(0, 255, 255, 0.1) 75%)
          `,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
        }}></div>
      </div>

      {/* Ambient Effects */}
      <div className="fixed top-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Floating Holographic Elements */}
      <div className="absolute top-20 left-10 w-8 h-8 border border-cyan-400/30 transform rotate-45 animate-pulse"></div>
      <div className="absolute top-32 right-16 w-6 h-6 border border-blue-400/30 transform rotate-45 animate-pulse delay-300"></div>
      <div className="absolute bottom-32 left-20 w-10 h-10 border border-purple-400/30 transform rotate-45 animate-pulse delay-700"></div>
      <div className="absolute bottom-20 right-10 w-4 h-4 border border-cyan-400/30 transform rotate-45 animate-pulse delay-1000"></div>

      {/* Scanning Lines */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse delay-500"></div>
      <div className="absolute top-0 left-0 h-full w-0.5 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse delay-300"></div>
      <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-transparent via-purple-400/30 to-transparent animate-pulse delay-700"></div>

      {/* Main Container - Mobile First */}
      <div className="container mx-auto px-4 py-6 max-w-sm sm:max-w-md lg:max-w-lg relative z-10">
       
          
        {/* Hexagonal Pattern Overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative h-96 sm:h-[450px] md:h-[500px] bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-400/30 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-2xl shadow-cyan-500/20">
          
          {/* Data Stream Lines */}
          <div className="absolute top-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-pulse"></div>
          <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse delay-300"></div>
          
          {/* Holographic Corner Effects with Enhanced Details */}
          <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-2xl sm:rounded-tl-3xl">
            <div className="absolute top-2 left-2 w-3 h-3 border border-cyan-400/70 transform rotate-45"></div>
            <div className="absolute top-1 left-6 w-6 h-px bg-cyan-400/50"></div>
            <div className="absolute top-6 left-1 w-px h-6 bg-cyan-400/50"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-2xl sm:rounded-tr-3xl">
            <div className="absolute top-2 right-2 w-3 h-3 border border-cyan-400/70 transform rotate-45"></div>
            <div className="absolute top-1 right-6 w-6 h-px bg-cyan-400/50"></div>
            <div className="absolute top-6 right-1 w-px h-6 bg-cyan-400/50"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-2xl sm:rounded-bl-3xl">
            <div className="absolute bottom-2 left-2 w-3 h-3 border border-cyan-400/70 transform rotate-45"></div>
            <div className="absolute bottom-1 left-6 w-6 h-px bg-cyan-400/50"></div>
            <div className="absolute bottom-6 left-1 w-px h-6 bg-cyan-400/50"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-20 sm:h-20 border-r-2 border-b-2 border-cyan-400/50 rounded-br-2xl sm:rounded-br-3xl">
            <div className="absolute bottom-2 right-2 w-3 h-3 border border-cyan-400/70 transform rotate-45"></div>
            <div className="absolute bottom-1 right-6 w-6 h-px bg-cyan-400/50"></div>
            <div className="absolute bottom-6 right-1 w-px h-6 bg-cyan-400/50"></div>
          </div>

      

          {/* Side Panel Indicators */}
          <div className="absolute left-2 top-1/4 space-y-2">
            <div className="w-2 h-8 bg-gradient-to-b from-cyan-400/50 to-transparent rounded-full animate-pulse"></div>
            <div className="w-2 h-6 bg-gradient-to-b from-blue-400/40 to-transparent rounded-full animate-pulse delay-300"></div>
            <div className="w-2 h-10 bg-gradient-to-b from-purple-400/30 to-transparent rounded-full animate-pulse delay-600"></div>
          </div>
          <div className="absolute right-2 top-1/4 space-y-2">
            <div className="w-2 h-6 bg-gradient-to-b from-purple-400/50 to-transparent rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-8 bg-gradient-to-b from-cyan-400/40 to-transparent rounded-full animate-pulse delay-500"></div>
            <div className="w-2 h-4 bg-gradient-to-b from-blue-400/30 to-transparent rounded-full animate-pulse delay-800"></div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center space-y-6 sm:space-y-8 relative z-10">
            
            {/* Logo Section */}
            <div className="space-y-3 sm:space-y-4">
              {/* Enhanced Cyberpunk Robot/AI Logo */}
              <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 relative">
                {/* Inner glow rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 animate-pulse"></div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-300 to-blue-500 rounded-full flex items-center justify-center relative">
                  <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
                  {/* Inner scanner lines */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse delay-500"></div>
                  </div>
                </div>
                {/* Multiple rotating rings */}
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-spin-slow"></div>
                <div className="absolute inset-1 rounded-full border border-blue-400/40 animate-spin-slow" style={{animationDirection: 'reverse', animationDuration: '12s'}}></div>
                
                {/* Corner targeting squares */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400/80"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400/80"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-400/80"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-400/80"></div>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider relative">
                OVERGOAL
                {/* Glitch effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent opacity-20 transform translate-x-0.5 translate-y-0.5 animate-pulse"></div>
              </h1>
              <p className="text-base sm:text-lg text-cyan-200/80 font-light tracking-wide relative">
                More than a match
                {/* Scanning line under subtitle */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse mt-2"></div>
              </p>
            </div>

            {/* Action Button */}
            <div className="space-y-3 sm:space-y-4 w-full">
              {/* Enhanced LOG IN Button */}
              <div className="relative">
                {/* Button background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur-sm"></div>
                <Button
                  onClick={onLoginClick}
                  disabled={isConnecting || status === "connecting" || (status === "connected" && playerLoading)}
                  className="w-full py-3 sm:py-4 text-base sm:text-lg font-bold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 hover:border-cyan-400/80 text-cyan-300 hover:text-cyan-200 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/40 disabled:opacity-50 relative overflow-hidden"
                >
                  {/* Multiple holographic scan effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse delay-300"></div>
                  
                  {/* Button corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-cyan-400/60"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-cyan-400/60"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-cyan-400/60"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-cyan-400/60"></div>
                  
                  {(isConnecting || status === "connecting") ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" />
                      <span className="text-sm sm:text-base">CONNECTING...</span>
                    </>
                  ) : status === "connected" && playerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" />
                      <span className="text-sm sm:text-base">CHECKING PLAYER...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      <span className="text-sm sm:text-base">LOG IN</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Status Indicator */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-3 text-xs text-cyan-400/60 bg-slate-900/50 px-4 py-2 rounded-full border border-cyan-400/20 backdrop-blur-sm">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse delay-400"></div>
              </div>
              <span className="text-xs sm:text-sm font-mono">POWERED BY DOJO & STARKNET</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 