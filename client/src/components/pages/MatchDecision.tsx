import React, { useState, useEffect } from 'react';
import MatchDecisionItem from '../ui/matchDecisionItem';

interface MatchDecisionProps {
    isOpen: boolean;
    onClose: () => void;
}

const MatchDecision: React.FC<MatchDecisionProps> = ({ isOpen, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (!isOpen) {
            setTimeLeft(5); // Reset timer when closed
            return;
        }

        if (timeLeft === 0) {
            onClose(); // Auto-close when timer ends
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isOpen, onClose]);

    if (!isOpen) return null;

    const decisions = [
        'Run for a cross',
        'Go for the second post looking for a rebound',
        'Ask for a passthrough pas close to the keep',
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center relative">
                {/* Timer */}
                <div
                    className="absolute top-0 left-5 w-24 h-24 bg-contain bg-no-repeat bg-center flex items-center justify-center"
                    style={{ backgroundImage: "url('/matchDecision/time-container.png')" }}
                >
                    <span className="text-white text-4xl font-bold" style={{ textShadow: '0 0 15px #0ff' }}>
                        {timeLeft}
                    </span>
                </div>

                {/* Player Display */}
                <div
                    className="w-[380px] h-[450px] bg-contain bg-no-repeat bg-center flex items-center justify-center"
                >
                    {/* NOTE: Replace with actual character image */}
                    <img src="https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png" alt="Player" className="h-full w-auto" />
                </div>

                {/* Decision Panel */}
                <div
                    className="w-[460px] h-[500px] bg-contain bg-no-repeat bg-center -mt-24 flex flex-col items-center justify-center p-24"
                    style={{ backgroundImage: "url('/matchDecision/Decision pop.png')" }}
                >
                    <p className="text-cyan-200 text-center text-lg mb-6 leading-relaxed" style={{ textShadow: '0 0 8px rgba(34,211,238,0.7)' }}>
                        Number 7 is getting close to the goalkeeper with the ball. What do you want to do?
                    </p>
                    <div className="w-full flex flex-col items-center space-y-2">
                        {decisions.map((text, index) => (
                            <MatchDecisionItem key={index} text={text} onClick={onClose} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchDecision;