import { useState, useEffect } from 'react';
import { vitalsService, VitalsData, VitalReading } from '@/services/vitalsService';

export const useVitals = (bedId: string = 'bed_15') => {
  const [data, setData] = useState<VitalsData>({ readings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await vitalsService.loadInitialData();
        vitalsService.startPolling();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vitals data');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = vitalsService.subscribe((newData) => {
      setData(newData);
    });

    initializeData();

    return () => {
      unsubscribe();
      vitalsService.stopPolling();
    };
  }, []);

  const getLatestVitals = (): VitalReading | null => {
    return vitalsService.getLatestReading(bedId);
  };

  const getFilteredData = (timeRange: string) => {
    return vitalsService.getFilteredData(bedId, timeRange);
  };

  return {
    data,
    loading,
    error,
    getLatestVitals,
    getFilteredData
  };
};