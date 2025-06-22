import React from "react";
import { useNavigate } from "react-router-dom";

const stats = [
  { name: 'SHOOTING', value: 72 },
  { name: 'DRIBBLING', value: 85 },
  { name: 'PASSING', value: 78 },
  { name: 'ENERGY', value: 80 },
  { name: 'FAME', value: 90 },
];

const NonMatchResult = () => {
  const navigate = useNavigate();



  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-cover bg-center"
      style={{ backgroundImage: "url('/nonMatchResult/BackGround.png')" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Character Display */}
        <div className="relative w-full mb-4 pt-16">
          <div className="rounded-xl bg-black/80 p-4 pt-16 border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <p className="text-white text-lg ml-8">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit facilis expedita quaerat enim dolorum ducimus
              corrupti itaque, molestiae recusandae eveniet modi, deleniti saepe ipsam dignissimos incidunt quam reiciendis
              mollitia quas.
            </p>
          </div>
          <img
            src="/nonMatchResult/Npc.png"
            alt="Character"
            className="absolute top-0 left-4 w-32 h-auto z-10"
          />
        </div>

        {/* Stats Board */}
        <div
          className="w-full h-96 bg-contain bg-black/80 bg-no-repeat bg-center flex flex-col items-center justify-center p-12"
          style={{ backgroundImage: "url('/nonMatchResult/Stats board.png')" }}
        >
          <ul className="w-full space-y-4">
            {stats.map((stat) => (
              <li key={stat.name} className="flex justify-between items-center w-full">
                <span className="text-cyan-300 text-2xl font-bold" >
                  {stat.name}
                </span>
                <span className="text-white text-2xl font-bold" style={{ textShadow: '0 0 10px #0ff' }}>
                  {stat.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Button */}
        <div className="w-full flex justify-end mt-4">
          <button
          onClick={() => {
            navigate("/main");
          }}
            className="w-40 h-14 bg-contain bg-no-repeat bg-center text-white text-lg font-bold flex items-center justify-center pr-4 transition-transform transform hover:scale-105"
            style={{ backgroundImage: "url('/nonMatchResult/Next Button.png')" }}
          >
          </button>
        </div>
      </div>
    </div>
  );
};

export default NonMatchResult