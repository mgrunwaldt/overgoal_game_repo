import React, { useState, useEffect } from "react";

const StaminaBar = ({
  useAnimation = false,
  initialStamina,
}: {
  useAnimation: boolean;
  initialStamina: number;
}) => {
  const [stamina, setStamina] = useState(initialStamina);

  useEffect(() => {
    if (useAnimation) {
      const interval = setInterval(() => {
        setStamina((prevStamina) => (prevStamina > 0 ? prevStamina - 1 : 0));
      }, 1000); // Decrease stamina every second

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="w-[350px] h-12 bg-black/30 p-2 rounded-lg border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
      <div
        className="h-full bg-[#a8f513] rounded transition-all duration-500 ease-linear"
        style={{ width: `${stamina}%` }}
      />
    </div>
  );
};

export default StaminaBar;
