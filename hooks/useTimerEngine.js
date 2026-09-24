import { useState, useEffect, useRef } from 'react';

export function useTimerEngine(hours, minutes, seconds, isActive, isPaused = false, onComplete) {
  const totalSeconds = 
    (parseInt(hours || '0', 10) * 3600) + 
    (parseInt(minutes || '0', 10) * 60) + 
    parseInt(seconds || '0', 10);

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef(null);
  const accumulatedMsRef = useRef(0); // Tracks perfectly banked time when paused
  const totalSecondsRef = useRef(totalSeconds);

  // Safely store the callback in a ref to avoid infinite re-renders 
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Sync state cleanly if the user changes inputs on screen 1
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(totalSeconds);
      setProgress(0);
      setIsCompleted(false);
      totalSecondsRef.current = totalSeconds;
      accumulatedMsRef.current = 0; // Reset banked time
    }
  }, [hours, minutes, seconds, isActive, totalSeconds]); 

  useEffect(() => {
    // If we aren't active, time is out, it's completed, OR it is actively paused, do not run the loop
    if (!isActive || totalSecondsRef.current <= 0 || isCompleted || isPaused) {
      return;
    }

    // Mark the exact timestamp we started (or resumed) running
    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const currentRunTime = Date.now() - startTime;
      const totalElapsedMs = accumulatedMsRef.current + currentRunTime;
      const elapsedSeconds = Math.floor(totalElapsedMs / 1000);
      const remainingTime = Math.max(0, totalSecondsRef.current - elapsedSeconds);

      setTimeLeft(remainingTime);

      const currentProgress = (elapsedSeconds / totalSecondsRef.current) * 100;
      setProgress(Math.min(100, currentProgress));

      if (remainingTime <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsCompleted(true);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 1000);

    return () => {
      // Clean up phase: if this effect unmounts (like when isPaused becomes true),
      // we take the time we just spent running and safely lock it in the bank.
      accumulatedMsRef.current += Date.now() - startTime;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, isCompleted]); // Hook now reacts instantly to isPaused changes

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