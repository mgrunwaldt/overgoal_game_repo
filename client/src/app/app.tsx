import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { usePlayer } from "../dojo/hooks/usePlayer";
import LoginScreen from "../components/pages/LoginScreen";
import CharacterSelectionScreen from "../components/pages/CharacterSelectionScreen";
import TeamManagement from "../components/team-management";
import TeamSelection from "../components/pages/TeamSelection";
import NewMatch from "../components/pages/NewMatch";
import MatchEnd from "../components/pages/MatchEnd";
import NonMatchEventSelector from "../components/pages/NonMatchEventSelector";
import MatchComponent from "../components/pages/MatchComponent";
import NonMatchResult from "../components/pages/NonMatchResult";
import MainScreen from "../components/pages/MainScreen";

function App() {
  const { account, status } = useAccount();
  const { player, isLoading: playerLoading } = usePlayer();
  
  const isConnected = status === "connected" && account;
  const hasValidPlayer = player !== null && player.is_player_created === true;



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
        <Route path="/login" element={<LoginScreen />} />
        <Route 
          path="/character-selection" 
          element={<CharacterSelectionScreen />} 
        />
      
        <Route path="/main" element={<MainScreen />} />
       
        <Route path="/teams" element={<TeamManagement />} />

        <Route path="/select-team" element={<TeamSelection />} />

        <Route path="/new-match/:matchId" element={<NewMatch />} />

        <Route path="/match/:matchId" element={<MatchComponent />} />

        <Route path="/match-end/:matchId" element={<MatchEnd />} />

        <Route 
          path="/non-match-event-selector" 
          element={<NonMatchEventSelector />} 
        />

        <Route path="/non-match-result" element={<NonMatchResult />} />
      </Routes>
    </Router>
  );
}

export default App;
