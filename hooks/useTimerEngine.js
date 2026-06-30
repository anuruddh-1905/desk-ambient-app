import { useState, useEffect, useRef } from 'react';

export function useTimerEngine(hours, minutes, seconds, isActive, onComplete) {
  const totalSeconds = 
    (parseInt(hours || '0', 10) * 3600) + 
    (parseInt(minutes || '0', 10) * 60) + 
    parseInt(seconds || '0', 10);

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalSecondsRef = useRef(totalSeconds);

  // Sync state cleanly if the user changes inputs on screen 1
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(totalSeconds);
      setProgress(0);
      setIsCompleted(false);
      totalSecondsRef.current = totalSeconds;
    }
  }, [hours, minutes, seconds, isActive]);

  useEffect(() => {
    // If the workspace isn't launched, don't spin up the interval loop
    if (!isActive || totalSecondsRef.current <= 0) return;

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsedMilliseconds = Date.now() - startTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
      const remainingTime = Math.max(0, totalSecondsRef.current - elapsedSeconds);

      setTimeLeft(remainingTime);

      const currentProgress = (elapsedSeconds / totalSecondsRef.current) * 100;
      setProgress(Math.min(100, currentProgress));

      if (remainingTime <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsCompleted(true);
        if (onComplete) onComplete();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const getFormattedTime = () => {
    const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return {
    timeLeft,
    progress,
    isCompleted,
    formattedTimeLeft: getFormattedTime(),
  };
}