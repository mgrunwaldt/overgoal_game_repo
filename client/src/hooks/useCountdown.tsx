import { useEffect, useState } from "react";

const useCountdown = () => {
  const [timer, setTimer] = useState(90); // Start at 90

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 250); // 667ms ≈ 60s / 90 steps

    return () => clearInterval(interval);
  }, []);

  return timer;
};

export default useCountdown;
