import { useEffect, useState } from "react";

const useCountdown = () => {
  const [timer, setTimer] = useState(0); // Start at 90

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 1;
      });
    }, 300); // 667ms ≈ 60s / 90 steps

    return () => clearInterval(interval);
  }, []);

  return timer;
};

export default useCountdown;
