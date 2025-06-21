import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import useAppStore from '../../zustand/store';
import { useCreateGameMatchAction } from '../../dojo/hooks/useCreateGameMatchAction';
import { MatchStatus, MatchAction, MatchDecision } from '../../zustand/store';

const GameMatch: React.FC = () => {
  const navigate = useNavigate();
  const { 
    player, 
    teams, 
    selectedTeam, 
    currentMatch, 
    setCurrentMatch,
    updateMatchStatus,
    updateMatchScore 
  } = useAppStore();
  
  const { 
    createGameMatchState, 
    executeCreateGameMatch, 
    canCreateGameMatch, 
    error 
  } = useCreateGameMatchAction();

  const [selectedOpponentTeam, setSelectedOpponentTeam] = useState<number | null>(null);
  const [matchId, setMatchId] = useState<number>(Date.now()); // Simple ID generation

  // Redirect if no player or selected team
  useEffect(() => {
    if (!player || !selectedTeam) {
      navigate('/team-selection');
      return;
    }
  }, [player, selectedTeam, navigate]);

  // Available opponent teams (exclude selected team)
  const availableOpponents = teams.filter(team => team.team_id !== selectedTeam?.team_id);

  const handleCreateMatch = async () => {
    if (!selectedTeam || !selectedOpponentTeam) return;

    await executeCreateGameMatch(matchId, selectedTeam.team_id, selectedOpponentTeam);
    
    if (createGameMatchState === 'success') {
      // Set the created match as current match
      const newMatch = {
        match_id: matchId,
        my_team_id: selectedTeam.team_id,
        opponent_team_id: selectedOpponentTeam,
        my_team_score: 0,
        opponent_team_score: 0,
        next_match_action: MatchAction.OpenPlay,
        next_match_action_minute: 1,
        current_time: 0,
        match_status: MatchStatus.NotStarted,
      };
      setCurrentMatch(newMatch);
    }
  };

  const handleStartMatch = () => {
    if (!currentMatch) return;
    updateMatchStatus(currentMatch.match_id, MatchStatus.InProgress);
  };

  const handleSimulateMatch = () => {
    if (!currentMatch) return;
    
    // Simple simulation - random scores
    const myScore = Math.floor(Math.random() * 4); // 0-3 goals
    const opponentScore = Math.floor(Math.random() * 4); // 0-3 goals
    
    updateMatchScore(currentMatch.match_id, myScore, opponentScore);
    updateMatchStatus(currentMatch.match_id, MatchStatus.Finished);
  };

  const getMatchStatusText = (status: number) => {
    switch (status) {
      case MatchStatus.NotStarted: return 'Not Started';
      case MatchStatus.InProgress: return 'In Progress';
      case MatchStatus.HalfTime: return 'Half Time';
      case MatchStatus.Finished: return 'Finished';
      default: return 'Unknown';
    }
  };

  const getMatchActionText = (action: number) => {
    switch (action) {
      case MatchAction.OpenPlay: return 'Open Play';
      case MatchAction.Jumper: return 'Jumper';
      case MatchAction.Brawl: return 'Brawl';
      case MatchAction.FreeKick: return 'Free Kick';
      case MatchAction.Penalty: return 'Penalty';
      case MatchAction.OpenDefense: return 'Open Defense';
      default: return 'Unknown';
    }
  };

  const getResultText = () => {
    if (!currentMatch || currentMatch.match_status !== MatchStatus.Finished) return '';
    
    if (currentMatch.my_team_score > currentMatch.opponent_team_score) {
      return '🏆 Victory!';
    } else if (currentMatch.my_team_score < currentMatch.opponent_team_score) {
      return '😔 Defeat';
    } else {
      return '🤝 Draw';
    }
  };

  if (!player || !selectedTeam) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚽ Game Match</h1>
          <p className="text-gray-300">Experience the thrill of football competition</p>
        </div>

        {/* Team Info */}
        <Card className="bg-slate-800/90 border-purple-500/30 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Team</h2>
          <div className="text-gray-300">
            <p><span className="text-purple-400">Name:</span> {selectedTeam.name}</p>
            <p><span className="text-purple-400">Offense:</span> {selectedTeam.offense}</p>
            <p><span className="text-purple-400">Defense:</span> {selectedTeam.defense}</p>
            <p><span className="text-purple-400">Intensity:</span> {selectedTeam.intensity}</p>
          </div>
        </Card>

        {/* Match Creation or Current Match */}
        {!currentMatch ? (
          <Card className="bg-slate-800/90 border-purple-500/30 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Create New Match</h2>
            
            {/* Opponent Selection */}
            <div className="mb-4">
              <label className="block text-purple-400 mb-2">Select Opponent Team:</label>
              <select 
                value={selectedOpponentTeam || ''} 
                onChange={(e) => setSelectedOpponentTeam(Number(e.target.value))}
                className="w-full p-3 bg-slate-700 border border-purple-500/30 rounded-lg text-white"
              >
                <option value="">Choose opponent...</option>
                {availableOpponents.map(team => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.name} (O:{team.offense} D:{team.defense} I:{team.intensity})
                  </option>
                ))}
              </select>
            </div>

            {/* Create Match Button */}
            <Button
              onClick={handleCreateMatch}
              disabled={!canCreateGameMatch || !selectedOpponentTeam || createGameMatchState === 'loading'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {createGameMatchState === 'loading' ? 'Creating Match...' : 'Create Match'}
            </Button>

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400">❌ {error}</p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="bg-slate-800/90 border-purple-500/30 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Current Match</h2>
            
            {/* Match Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* My Team */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Your Team</h3>
                <p className="text-white text-2xl font-bold">{selectedTeam.name}</p>
                <p className="text-3xl font-bold text-green-400">{currentMatch.my_team_score}</p>
              </div>

              {/* VS */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Opponent</h3>
                <p className="text-white text-2xl font-bold">
                  {teams.find(t => t.team_id === currentMatch.opponent_team_id)?.name || 'Unknown'}
                </p>
                <p className="text-3xl font-bold text-red-400">{currentMatch.opponent_team_score}</p>
              </div>
            </div>

            {/* Match Status */}
            <div className="text-center mb-6">
              <p className="text-gray-300">
                <span className="text-purple-400">Status:</span> {getMatchStatusText(currentMatch.match_status)}
              </p>
              <p className="text-gray-300">
                <span className="text-purple-400">Time:</span> {currentMatch.current_time} min
              </p>
              {currentMatch.match_status === MatchStatus.InProgress && (
                <p className="text-gray-300">
                  <span className="text-purple-400">Next Action:</span> {getMatchActionText(currentMatch.next_match_action)}
                </p>
              )}
            </div>

            {/* Result */}
            {currentMatch.match_status === MatchStatus.Finished && (
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-yellow-400">{getResultText()}</p>
              </div>
            )}

            {/* Match Actions */}
            <div className="flex gap-4 justify-center">
              {currentMatch.match_status === MatchStatus.NotStarted && (
                <Button
                  onClick={handleStartMatch}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  Start Match
                </Button>
              )}
              
              {currentMatch.match_status !== MatchStatus.Finished && (
                <Button
                  onClick={handleSimulateMatch}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  Simulate Match
                </Button>
              )}

              {currentMatch.match_status === MatchStatus.Finished && (
                <Button
                  onClick={() => setCurrentMatch(null)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  New Match
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/main')}
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            ← Back to Main
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameMatch;