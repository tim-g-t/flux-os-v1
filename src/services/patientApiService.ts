import { APIPatient, APIVitalReading, TransformedPatient } from '@/types/patient';
import { VitalReading } from './vitalsService';

// Use proxied endpoint in development to avoid CORS issues
const API_URL = import.meta.env.DEV
  ? '/api/patient-data'  // Proxied through Vite in development
  : 'http://a0g88w80ssoos8gkgcs408gs.157.90.23.234.sslip.io/data';
const CACHE_KEY = 'patient_data_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class PatientApiService {
  private patients: APIPatient[] = [];
  private loading = false;
  private lastFetchTime: number | null = null;
  private listeners: Array<(patients: APIPatient[]) => void> = [];

  // Transform API vital reading to internal format
  transformVitalReading(apiVital: APIVitalReading): VitalReading {
    return {
      hr: apiVital.Pulse,
      bps: apiVital.BloodPressure.Systolic,
      bpd: apiVital.BloodPressure.Diastolic,
      rr: apiVital.RespirationRate,
      temp: apiVital.Temp,
      spo2: apiVital.SpO2
    };
  }

  // Transform API patient to display format
  transformPatient(apiPatient: APIPatient): TransformedPatient {
    return {
      id: `bed_${apiPatient.Identifier.toString().padStart(2, '0')}`,
      identifier: apiPatient.Identifier,
      name: apiPatient.Name,
      bed: apiPatient.Bed,
      age: apiPatient.Age,
      gender: apiPatient.Gender,
      vitals: apiPatient.Vitals
    };
  }

  // Check if cached data is still valid
  private isCacheValid(): boolean {
    if (!this.lastFetchTime) return false;
    return Date.now() - this.lastFetchTime < CACHE_DURATION;
  }

  // Load cached data from localStorage
  private loadFromCache(): APIPatient[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          this.lastFetchTime = timestamp;
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to load from cache:', error);
    }
    return null;
  }

  // Save data to cache
  private saveToCache(data: APIPatient[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  // Fetch patients from API with timeout handling
  async fetchPatients(forceRefresh = false): Promise<APIPatient[]> {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      return this.patients;
    }

    // Check localStorage cache
    if (!forceRefresh) {
      const cached = this.loadFromCache();
      if (cached) {
        this.patients = cached;
        this.notifyListeners();
        return cached;
      }
    }

    // Prevent multiple simultaneous fetches
    if (this.loading) {
      return this.patients;
    }

    this.loading = true;

    try {
      // Create abort controller for timeout - increased to 120 seconds for large dataset
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      console.log('Fetching patient data from API (this will take 30+ seconds due to large dataset)...');

      const response = await fetch(API_URL, {
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: APIPatient[] = await response.json();

      this.patients = data;
      this.lastFetchTime = Date.now();
      this.saveToCache(data);
      this.notifyListeners();

      console.log(`Successfully loaded ${data.length} patients from API`);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('API request timed out after 120 seconds');
          throw new Error('API request timed out after 2 minutes. Please try again.');
        }
        console.error('Failed to fetch patients:', error.message);
        throw error;
      }
      throw new Error('Failed to fetch patient data');
    } finally {
      this.loading = false;
    }
  }

  // Get all patients
  getPatients(): APIPatient[] {
    return this.patients;
  }

  // Get patient by bed ID
  getPatientByBedId(bedId: string): APIPatient | null {
    // Extract number from bedId (e.g., "bed_01" -> 1)
    const match = bedId.match(/bed_(\d+)/);
    if (!match) return null;

    const identifier = parseInt(match[1], 10);
    return this.patients.find(p => p.Identifier === identifier) || null;
  }

  // Get latest vitals for a patient
  getLatestVitals(bedId: string): VitalReading | null {
    const patient = this.getPatientByBedId(bedId);
    if (!patient || patient.Vitals.length === 0) return null;

    const latestVital = patient.Vitals[patient.Vitals.length - 1];
    return this.transformVitalReading(latestVital);
  }

  // Get filtered vitals data for charts
  getFilteredVitals(bedId: string, hours: number = 24): APIVitalReading[] {
    const patient = this.getPatientByBedId(bedId);
    if (!patient) return [];

    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    return patient.Vitals.filter(vital =>
      new Date(vital.time) >= startTime
    );
  }

  // Subscribe to patient updates
  subscribe(callback: (patients: APIPatient[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.patients));
  }

  // Check if currently loading
  isLoading(): boolean {
    return this.loading;
  }
}

export const patientApiService = new PatientApiService();