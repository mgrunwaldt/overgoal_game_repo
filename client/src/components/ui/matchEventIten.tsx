import React from 'react'

interface MatchEventItemProps {
  text: string;
  playable?: boolean;
  team?: 'player' | 'enemy';
}

const MatchEventIten: React.FC<MatchEventItemProps> = ({ text, playable = false, team = 'player' }) => {
  const baseClasses =
    'flex justify-between items-center p-2 rounded-md transition-all duration-300 border-b-2 backdrop-blur-sm';

  const getTeamStyles = () => {
    if (team === 'enemy') {
      return 'bg-red-900/40 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
    }
    if (playable) {
      return 'bg-cyan-900/40 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-800/60 cursor-pointer';
    }
    return 'bg-gray-900/40 border-gray-700/50 text-gray-300';
  };

  const buttonClasses =
    'ml-4 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-md shadow-[0_0_10px_rgba(34,211,238,0.7)] transition-all duration-300 transform hover:scale-105';

  return (
    <li className={`${baseClasses} ${getTeamStyles()}`}>
      <span className="font-sans tracking-wider">{text}</span>
      {playable && (
        <button className={buttonClasses}>
          PLAY
        </button>
      )}
    </li>
  );
};

export default MatchEventIten