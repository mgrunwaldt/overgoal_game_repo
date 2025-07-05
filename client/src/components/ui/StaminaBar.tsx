import React, { useState, useEffect } from "react";

const StaminaBar = ({
  useAnimation = false,
  initialStamina,
}: {
  useAnimation: boolean;
  initialStamina: number;
}) => {
  const [stamina, setStamina] = useState<number>(initialStamina);

  useEffect(() => {
    if (useAnimation) {
      const interval = setInterval(() => {
        setStamina((prevStamina) => (prevStamina > 0 ? prevStamina - 1 : 0));
      }, 1000); // Decrease stamina every second

      return () => clearInterval(interval);
    }
  }, [useAnimation, initialStamina]);

  return (
    <div className="w-[350px] h-12 bg-black/30 p-2 rounded-lg border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] relative text-center">
      <p className="text-white/90 text-lg w-full font-semibold absolute [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
        Stamina
      </p>
      <div
        className="h-full text-center  bg-[#a8f513] rounded transition-all duration-500 ease-linear"
        style={{ width: `${stamina}%` }}
      ></div>
    </div>
  );
};

export default StaminaBar;
