import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { usePlayer } from "../dojo/hooks/usePlayer";
import LoginScreen from "../components/pages/LoginScreen";
import HomePage from "../components/pages/HomeScreen";
import CharacterSelectionScreen from "../components/pages/CharacterSelectionScreen";
import MainScreen from "../components/pages/MainScreen";
import TeamManagement from "../components/team-management";
import TeamSelection from "../components/pages/TeamSelection";

function App() {
  const { account, status } = useAccount();
  const { player, isLoading: playerLoading } = usePlayer();
  
  const isConnected = status === "connected" && account;
  const hasValidPlayer = player !== null && player.is_player_created === true;

  console.log("🎯 App Router State:", {
    status,
    isConnected,
    hasValidPlayer,
    playerLoading,
    playerExists: !!player,
    isPlayerCreated: player?.is_player_created,
    accountAddress: account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "none"
  });

  // Loading component
  const LoadingScreen = ({ message }: { message: string }) => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p>{message}</p>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={<LoginScreen />} 
        />
        <Route 
          path="/character-selection" 
          element={<CharacterSelectionScreen />} 
        />
      
        <Route 
          path="/main" 
          element={<MainScreen />} 
        />
       
       <Route 
          path="/teams" 
          element={<TeamManagement />} 
        />

      <Route 
          path="/select-team" 
          element={<TeamSelection />} 
        />


      </Routes>
    </Router>
  );
}

export default App;