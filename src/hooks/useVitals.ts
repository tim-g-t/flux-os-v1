import { useState, useEffect, useCallback } from 'react';
import { patientApiService } from '@/services/patientApiService';
import { VitalReading } from '@/types/vitals';
import { APIPatient } from '@/types/patient';

export const useVitals = (bedId: string = 'bed_01') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<APIPatient | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Check if patients are already loaded
        const patients = patientApiService.getPatients();
        if (patients.length === 0) {
          // Fetch patients if not loaded
          await patientApiService.fetchPatients();
        }

        // Get the specific patient
        const patientData = patientApiService.getPatientByBedId(bedId);
        if (patientData) {
          setPatient(patientData);
        } else {
          setError(`Patient with bed ID ${bedId} not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vitals data');
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to patient updates
    const unsubscribe = patientApiService.subscribe((updatedPatients) => {
      const updatedPatient = patientApiService.getPatientByBedId(bedId);
      if (updatedPatient) {
        setPatient(updatedPatient);
      }
    });

    initializeData();

    return () => {
      unsubscribe();
    };
  }, [bedId]);

  const getLatestVitals = useCallback((): VitalReading | null => {
    return patientApiService.getLatestVitals(bedId);
  }, [bedId]);

  const getFilteredData = useCallback((timeRange: string) => {
    if (!patient) return [];

    // Parse time range to hours
    let hours = 24;
    switch (timeRange) {
      case '1h': hours = 1; break;
      case '4h': hours = 4; break;
      case '12h': hours = 12; break;
      case '24h': hours = 24; break;
      case '1w': hours = 168; break;
      default: hours = 24;
    }

    // Get filtered vitals from the API service
    const filteredVitals = patientApiService.getFilteredVitals(bedId, hours);

    // Transform to the expected format
    return filteredVitals.map(vital => ({
      timestamp: vital.time,
      vital: patientApiService.transformVitalReading(vital)
    }));
  }, [bedId, patient]);

  // For backward compatibility, create a data object similar to the old format
  const data = {
    readings: patient?.Vitals?.map(vital => ({
      timestamp: vital.time,
      [bedId]: patientApiService.transformVitalReading(vital)
    })) || []
  };

  return {
    data,
    loading,
    error,
    getLatestVitals,
    getFilteredData
  };
};