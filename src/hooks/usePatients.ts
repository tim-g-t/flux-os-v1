import { useState, useEffect } from 'react';
import { vitalsService, PatientData } from '@/services/vitalsService';

export const usePatients = () => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await vitalsService.loadInitialData();
        setPatients(vitalsService.getPatients());
        vitalsService.startPolling();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = vitalsService.subscribeToPatients((newPatients) => {
      setPatients(newPatients);
    });

    initializeData();

    return () => {
      unsubscribe();
      vitalsService.stopPolling();
    };
  }, []);

  const getPatient = (patientId: string): PatientData | null => {
    return vitalsService.getPatient(patientId);
  };

  const setServerEndpoint = (url: string) => {
    vitalsService.setDataSource({
      type: 'server',
      url,
      pollInterval: 5000 // Poll server every 5 seconds
    });
  };

  const setLocalFile = (filename: string = '/vitals.json') => {
    vitalsService.setDataSource({
      type: 'local',
      url: filename,
      pollInterval: 1000
    });
  };

  return {
    patients,
    loading,
    error,
    getPatient,
    setServerEndpoint,
    setLocalFile
  };
};