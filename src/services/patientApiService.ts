import { APIPatient, APIVitalReading, TransformedPatient } from '@/types/patient';
import { VitalReading } from '@/types/vitals';

// Use proxied endpoint in development to avoid CORS issues
const API_URL = import.meta.env.DEV
  ? '/api/patient-data'  // Proxied through Vite in development
  : 'http://a0g88w80ssoos8gkgcs408gs.157.90.23.234.sslip.io/data';
// Use proxied endpoints in development to avoid CORS, direct URLs in production
const SNAPSHOT_API_URL = import.meta.env.DEV
  ? '/api/vitals/snapshot'
  : 'http://g04swcgcwsco40kw4s4gwko8.157.90.23.234.sslip.io/vitals/snapshot';
const CURRENT_API_URL = import.meta.env.DEV
  ? '/api/vitals/current'
  : 'http://g04swcgcwsco40kw4s4gwko8.157.90.23.234.sslip.io/vitals/current';
const INCREMENT_API_URL = import.meta.env.DEV
  ? '/api/vitals/increment'
  : 'http://g04swcgcwsco40kw4s4gwko8.157.90.23.234.sslip.io/vitals/increment';
const SAVE_API_URL = import.meta.env.DEV
  ? '/api/vitals/save'
  : 'http://g04swcgcwsco40kw4s4gwko8.157.90.23.234.sslip.io/vitals/save';
const CACHE_KEY = 'patient_data_cache';
const VITAL_HISTORY_KEY = 'patient_vital_history';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LOCAL_FILE_PATH = '/Users/timtoepper/Downloads/code-of-website/patient-data.json';
const SNAPSHOT_INTERVAL = 5000; // 5 seconds

class PatientApiService {
  private patients: APIPatient[] = [];
  private loading = false;
  private lastFetchTime: number | null = null;
  private listeners: Array<(patients: APIPatient[], updateVersion?: number) => void> = [];
  private snapshotInterval: NodeJS.Timeout | null = null;
  private lastSnapshotIdentifier: number = -1;
  private isUsingSnapshot = false;
  private vitalCycleRunning = false;
  private updateVersion = 0;

  // Transform API vital reading to internal format
  transformVitalReading(apiVital: APIVitalReading): VitalReading {
    return {
      hr: apiVital.Pulse,
      bps: apiVital.BloodPressure.Systolic,
      bpd: apiVital.BloodPressure.Diastolic,
      rr: apiVital.RespirationRate,
      temp: typeof apiVital.Temp === 'string' ? parseFloat(apiVital.Temp) : apiVital.Temp,
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
      // Also save vital history separately for graphs
      this.saveVitalHistory(data);
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  // Save vital history for patient graphs
  private saveVitalHistory(data: APIPatient[]): void {
    try {
      // Create a simplified vital history object for efficient storage
      const vitalHistory: Record<number, APIVitalReading[]> = {};

      data.forEach(patient => {
        if (patient.Vitals && patient.Vitals.length > 0) {
          // Store vitals by patient identifier
          vitalHistory[patient.Identifier] = patient.Vitals;
        }
      });

      localStorage.setItem(VITAL_HISTORY_KEY, JSON.stringify({
        history: vitalHistory,
        lastUpdated: Date.now()
      }));

      console.log(`Saved vital history for ${Object.keys(vitalHistory).length} patients`);
    } catch (error) {
      console.error('Failed to save vital history:', error);
    }
  }

  // Load vital history from localStorage
  private loadVitalHistory(): Record<number, APIVitalReading[]> | null {
    try {
      const stored = localStorage.getItem(VITAL_HISTORY_KEY);
      if (stored) {
        const { history } = JSON.parse(stored);
        return history;
      }
    } catch (error) {
      console.error('Failed to load vital history:', error);
    }
    return null;
  }

  // Try to load from local file via API endpoint (silently fail if not available)
  private async tryLoadFromLocalFile(): Promise<APIPatient[] | null> {
    try {
      // Try the local file endpoint first (will be proxied in dev)
      const localUrl = import.meta.env.DEV ? '/api/local-data' : 'http://localhost:5173/api/local-data';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // Very short timeout for local file

      const response = await fetch(localUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded data from local cache (fast)');
        return data;
      }
    } catch {
      // Silently fail - this is expected if file doesn't exist
    }
    return null;
  }

  // Trigger vital signs increment
  private async triggerVitalIncrement(): Promise<void> {
    try {
      const response = await fetch(INCREMENT_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Increment API error:', response.status);
        return;
      }

      console.log('Triggered vital signs increment');
    } catch (error) {
      console.error('Failed to trigger increment:', error);
    }
  }

  // Save vital signs to snapshot
  private async saveVitalSnapshot(): Promise<void> {
    try {
      const response = await fetch(SAVE_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Save API error:', response.status);
        return;
      }

      console.log('Saved vital signs to snapshot');
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    }
  }

  // Fetch snapshot data from API
  private async fetchSnapshot(): Promise<void> {
    try {
      const response = await fetch(SNAPSHOT_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Snapshot API error:', response.status);
        return;
      }

      const snapshotData = await response.json();

      // Check if identifier has changed
      if (snapshotData.identifier !== this.lastSnapshotIdentifier && snapshotData.identifier !== undefined) {
        this.lastSnapshotIdentifier = snapshotData.identifier;

        // Process the new vital data
        if (snapshotData.patients && Array.isArray(snapshotData.patients)) {
          this.updatePatientsWithSnapshot(snapshotData.patients);
        }
      }
    } catch (error) {
      console.error('Failed to fetch snapshot:', error);
    }
  }

  // Execute the vital signs update cycle
  private async executeVitalCycle(): Promise<void> {
    if (this.vitalCycleRunning) {
      console.log('Vital cycle already running, skipping...');
      return;
    }

    this.vitalCycleRunning = true;

    try {
      console.log('Starting vital cycle...');

      // Step 1: Trigger increment
      await this.triggerVitalIncrement();
      console.log('Step 1: Increment triggered');

      // Step 2: Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('Step 2: Waited 5 seconds');

      // Step 3: Save new state
      await this.saveVitalSnapshot();
      console.log('Step 3: Saved snapshot');

      // Step 4: Retrieve updated vital signs
      await this.fetchSnapshot();
      console.log('Step 4: Fetched new snapshot');

      console.log('Completed vital signs update cycle');
    } catch (error) {
      console.error('Error in vital cycle:', error);
    } finally {
      this.vitalCycleRunning = false;
    }
  }

  // Update patients with snapshot data
  private updatePatientsWithSnapshot(snapshotPatients: Array<{
    Identifier: number;
    Name: string;
    Bed: string;
    Gender: string;
    Age: number;
    Vital?: {
      time: string;
      Pulse: number;
      BloodPressure: {
        Systolic: number;
        Diastolic: number;
        Mean: number;
      };
      RespirationRate: number;
      SpO2: number;
      Temp: string;
    };
  }>): void {
    let updated = false;

    snapshotPatients.forEach(snapshotPatient => {
      // Find existing patient by BOTH identifier AND name for exact matching
      const existingPatient = this.patients.find(p =>
        p.Identifier === snapshotPatient.Identifier &&
        p.Name === snapshotPatient.Name
      );

      if (existingPatient && snapshotPatient.Vital) {
        // Convert snapshot vital to API format (Temp comes as string, needs conversion)
        const newVital: APIVitalReading = {
          time: snapshotPatient.Vital.time,
          Pulse: snapshotPatient.Vital.Pulse,
          BloodPressure: {
            Systolic: snapshotPatient.Vital.BloodPressure.Systolic,
            Diastolic: snapshotPatient.Vital.BloodPressure.Diastolic,
            Mean: snapshotPatient.Vital.BloodPressure.Mean
          },
          RespirationRate: snapshotPatient.Vital.RespirationRate,
          SpO2: snapshotPatient.Vital.SpO2,
          Temp: parseFloat(snapshotPatient.Vital.Temp) || 0
        };

        // Check if this vital reading already exists (prevent duplicates)
        const existingVitalIndex = existingPatient.Vitals.findIndex(v => v.time === newVital.time);
        if (existingVitalIndex === -1) {
          // Add new vital to existing patient's vitals (preserving history)
          existingPatient.Vitals.push(newVital);

          // Keep only last 1000 vitals to prevent memory issues
          if (existingPatient.Vitals.length > 1000) {
            existingPatient.Vitals = existingPatient.Vitals.slice(-1000);
          }

          updated = true;
        }
      } else if (!existingPatient && snapshotPatient.Vital) {
        // Create new patient from snapshot if doesn't exist
        const newPatient: APIPatient = {
          Identifier: snapshotPatient.Identifier,
          Name: snapshotPatient.Name,
          Bed: snapshotPatient.Bed,
          Gender: snapshotPatient.Gender,
          Age: snapshotPatient.Age,
          Vitals: [{
            time: snapshotPatient.Vital.time,
            Pulse: snapshotPatient.Vital.Pulse,
            BloodPressure: {
              Systolic: snapshotPatient.Vital.BloodPressure.Systolic,
              Diastolic: snapshotPatient.Vital.BloodPressure.Diastolic,
              Mean: snapshotPatient.Vital.BloodPressure.Mean
            },
            RespirationRate: snapshotPatient.Vital.RespirationRate,
            SpO2: snapshotPatient.Vital.SpO2,
            Temp: parseFloat(snapshotPatient.Vital.Temp) || 0
          }]
        };
        this.patients.push(newPatient);
        updated = true;
        console.log(`Created new patient from snapshot: ${snapshotPatient.Name} (ID: ${snapshotPatient.Identifier})`);
      }
    });

    if (updated) {
      console.log(`Updated vitals from snapshot (ID: ${this.lastSnapshotIdentifier})`);
      // Update cache with merged data including vital history
      this.saveToCache(this.patients);
      this.notifyListeners();
    }
  }

  // Start snapshot polling with vital cycle
  startSnapshotPolling(): void {
    if (this.snapshotInterval) {
      return; // Already polling
    }

    console.log('Starting vital snapshot cycle (increment->wait->save->fetch)...');
    this.isUsingSnapshot = true;

    // Fetch initial snapshot immediately
    this.fetchSnapshot();

    // Set up interval for the complete cycle
    this.snapshotInterval = setInterval(async () => {
      await this.executeVitalCycle();
    }, 15000); // Run cycle every 15 seconds (includes 5s wait in cycle)
  }

  // Stop snapshot polling
  stopSnapshotPolling(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
      this.isUsingSnapshot = false;
      console.log('Stopped vital snapshot polling');
    }
  }


  // Fetch patients from API with timeout handling
  async fetchPatients(forceRefresh = false): Promise<APIPatient[]> {
    // Clear cache if forcing refresh
    if (forceRefresh) {
      this.clearCache();
    }

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      // Start snapshot polling after returning cached data
      this.startSnapshotPolling();
      return this.patients;
    }

    // Check localStorage cache
    if (!forceRefresh) {
      const cached = this.loadFromCache();
      if (cached) {
        this.patients = cached;
        this.notifyListeners();
        // Start snapshot polling after loading cached data
        this.startSnapshotPolling();
        return cached;
      }
    }

    // Prevent multiple simultaneous fetches
    if (this.loading) {
      return this.patients;
    }

    this.loading = true;

    // First, try to load from local file (super fast)
    if (!forceRefresh) {
      const localData = await this.tryLoadFromLocalFile();
      if (localData) {
        this.patients = localData;
        this.lastFetchTime = Date.now();
        this.saveToCache(localData);
        this.notifyListeners();
        this.loading = false;
        // Start snapshot polling after loading local data - this will merge new data
        this.startSnapshotPolling();
        return localData;
      }
    }

    try {
      // Create abort controller for timeout - increased to 120 seconds for large dataset
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      console.log('Fetching historical patient data from main API...');

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

      console.log(`Successfully loaded ${data.length} patients with historical data from main API`);

      // Start snapshot polling after loading API data for real-time updates
      this.startSnapshotPolling();

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

  // Get filtered vitals data for charts (point-based, not time-based)
  getFilteredVitals(bedId: string, hours: number = 24): APIVitalReading[] {
    const patient = this.getPatientByBedId(bedId);
    if (!patient || !patient.Vitals || patient.Vitals.length === 0) return [];

    // Calculate approximate points for time range
    // Assuming ~5 min intervals (12 points per hour)
    const pointsPerHour = 12;
    let maxPoints = hours * pointsPerHour;

    // For week view, cap at reasonable amount
    if (hours > 168) { // 1 week
      maxPoints = Math.min(maxPoints, 500);
    }

    // Cap at available data
    maxPoints = Math.min(maxPoints, patient.Vitals.length);

    // Just take the last N points, treating them as continuous
    const vitals = [...patient.Vitals];
    const filteredVitals = vitals.slice(-maxPoints);

    console.log(`Filtering for ${hours}h view: Requested ${maxPoints} points, Returning ${filteredVitals.length} points from ${vitals.length} total`);

    return filteredVitals;
  }

  // Get complete vital history for a patient (for graphs)
  getPatientVitalHistory(patientId: number): APIVitalReading[] {
    // First try to get from current patients array
    const patient = this.patients.find(p => p.Identifier === patientId);
    if (patient && patient.Vitals) {
      return patient.Vitals;
    }

    // If not found, try to load from vital history storage
    const vitalHistory = this.loadVitalHistory();
    if (vitalHistory && vitalHistory[patientId]) {
      return vitalHistory[patientId];
    }

    return [];
  }

  // Subscribe to patient updates with version tracking
  subscribe(callback: (patients: APIPatient[], updateVersion?: number) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners with update version
  private notifyListeners(): void {
    this.updateVersion++;
    console.log(`Notifying listeners with update version: ${this.updateVersion}`);
    this.listeners.forEach(listener => listener(this.patients, this.updateVersion));
  }

  // Check if currently loading
  isLoading(): boolean {
    return this.loading;
  }

  // Clean up method to stop polling
  cleanup(): void {
    this.stopSnapshotPolling();
  }

  // Clear all cached data
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(VITAL_HISTORY_KEY);
      this.patients = [];
      this.lastFetchTime = null;
      this.lastSnapshotIdentifier = -1;
      this.vitalCycleRunning = false;
      this.updateVersion = 0;
      console.log('Cache and vital history cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

export const patientApiService = new PatientApiService();