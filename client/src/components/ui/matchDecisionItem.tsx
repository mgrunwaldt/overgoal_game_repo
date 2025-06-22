import React from 'react';

interface MatchDecisionItemProps {
  text: string;
  onClick: () => void;
}

const MatchDecisionItem: React.FC<MatchDecisionItemProps> = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full h-14 bg-contain bg-no-repeat bg-center text-white text-sm font-bold flex items-center justify-center transition-transform transform hover:scale-105 px-6 text-center"
      style={{ backgroundImage: "url('/matchDecision/Large button.png')" }}
    >
      {text}
    </button>
  );
};

export default MatchDecisionItem;