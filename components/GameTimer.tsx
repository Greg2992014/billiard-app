'use client';
import { useEffect, useState } from 'react';

interface GameTimerProps {
  startTime: number;
  isActive: boolean;
}

export function GameTimer({ startTime, isActive }: GameTimerProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setDuration(0);
    if (!isActive) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setDuration(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <span className="font-mono text-xs font-medium text-gray-400">
      {formatTime(duration)}
    </span>
  );
}
