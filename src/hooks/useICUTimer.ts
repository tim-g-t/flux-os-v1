import { useState, useEffect } from 'react';

/**
 * Hook to manage ICU duration timer
 * Starts at 142 hours and increments every hour
 */
export const useICUTimer = (initialHours: number = 142) => {
  const [hours, setHours] = useState(initialHours);

  useEffect(() => {
    // Increment every hour (3600000 ms)
    const interval = setInterval(() => {
      setHours(prev => prev + 1);
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  return `${hours}h`;
};
