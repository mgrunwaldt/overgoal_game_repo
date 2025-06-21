import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import LoginScreen from "../components/pages/LoginScreen";
import HomePage from "../components/pages/HomeScreen";

function App() {
  const { account, status } = useAccount();
  const isConnected = status === "connected" && account;

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isConnected ? <Navigate to="/game" replace /> : <LoginScreen />} 
        />
        <Route 
          path="/game" 
          element={isConnected ? <HomePage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isConnected ? "/game" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;