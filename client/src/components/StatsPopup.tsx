import React from 'react';

interface StatsPopupProps {
  stats: {
    stamina: number;
    energy: number;
    charisma: number;
    dribble: number;
    fame: number;
  };
  onClose: () => void;
  teamName: string;
  teamPoints: number;
}

const StatsPopup: React.FC<StatsPopupProps> = ({ stats, onClose, teamName, teamPoints }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div 
        className="relative w-[400px] h-[550px] bg-contain bg-no-repeat bg-center p-8 flex flex-col items-center text-white"
        style={{ backgroundImage: "url('/CharacterSelection/statsBoard.png')" }}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white text-3xl font-bold">&times;</button>
        <h2 className="text-3xl font-bold mb-6 text-cyan-300 glow">Player Stats</h2>
        
        <div className="w-full space-y-4 text-lg">
            <div className="flex justify-between"><span>Stamina:</span> <span>{stats.stamina}</span></div>
            <div className="flex justify-between"><span>Energy:</span> <span>{stats.energy}</span></div>
            <div className="flex justify-between"><span>Charisma:</span> <span>{stats.charisma}</span></div>
            <div className="flex justify-between"><span>Dribble:</span> <span>{stats.dribble}</span></div>
            <div className="flex justify-between"><span>Fame:</span> <span>{stats.fame}</span></div>
        </div>

        <div className="mt-8 pt-4 border-t-2 border-cyan-400 w-full text-center">
            <h3 className="text-2xl font-bold text-cyan-300 [text-shadow:0_0_5px_#0ff,0_0_10px_#0ff]">{teamName}</h3>
            <p className="text-lg">League Points: {teamPoints}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsPopup; 