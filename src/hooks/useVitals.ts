import { useState, useEffect, useCallback } from 'react';
import { patientApiService } from '@/services/patientApiService';
import { VitalReading } from '@/types/vitals';
import { APIPatient } from '@/types/patient';

export const useVitals = (bedId: string = 'bed_01') => {
  // Check if data is already loaded to set initial loading state
  const initialDataLoaded = patientApiService.getPatients().length > 0;
  const [loading, setLoading] = useState(!initialDataLoaded);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<APIPatient | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if patients are already loaded
        const patients = patientApiService.getPatients();

        // If data is already loaded, get patient immediately without setting loading
        if (patients.length > 0) {
          const patientData = patientApiService.getPatientByBedId(bedId);
          if (patientData) {
            setPatient(patientData);
            setLoading(false);
            setError(null);
            // Don't start polling here - it's already handled by the service
          } else {
            setError(`Patient with bed ID ${bedId} not found`);
            setLoading(false);
          }
          return;
        }

        // Only set loading if we actually need to fetch
        setLoading(true);
        await patientApiService.fetchPatients();

        // Get the specific patient after fetching
        const patientData = patientApiService.getPatientByBedId(bedId);
        if (patientData) {
          setPatient(patientData);
          setError(null);
        } else {
          setError(`Patient with bed ID ${bedId} not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vitals data');
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to patient updates with version tracking
    const unsubscribe = patientApiService.subscribe((updatedPatients, updateVersion) => {
      const updatedPatient = patientApiService.getPatientByBedId(bedId);
      if (updatedPatient) {
        // CRITICAL: Create a new object reference to trigger React re-render
        // React won't re-render if the object reference is the same
        setPatient({...updatedPatient});
        setLoading(false);
        // Force re-render with update version
        setUpdateTrigger(updateVersion || 0);
        console.log(`🔄 Hook received update v${updateVersion} for ${bedId}`);
      }
    });

    initializeData();

    return () => {
      unsubscribe();
    };
  }, [bedId]);

  const getLatestVitals = useCallback((): VitalReading | null => {
    return patientApiService.getLatestVitals(bedId);
  }, [bedId, updateTrigger]); // Add updateTrigger to dependencies

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

    // Get filtered vitals from the API service (now point-based)
    const filteredVitals = patientApiService.getFilteredVitals(bedId, hours);

    // Transform to the expected format
    return filteredVitals.map(vital => ({
      timestamp: vital.time,
      vital: patientApiService.transformVitalReading(vital)
    }));
  }, [bedId, patient, updateTrigger]); // Add updateTrigger to dependencies

  // For backward compatibility, create a data object similar to the old format
  // Use updateTrigger to ensure this recalculates on updates
  const data = useCallback(() => ({
    readings: patient?.Vitals?.map(vital => ({
      timestamp: vital.time,
      [bedId]: patientApiService.transformVitalReading(vital)
    })) || []
  }), [patient, bedId, updateTrigger])();

  return {
    data,
    loading,
    error,
    getLatestVitals,
    getFilteredData
  };
};