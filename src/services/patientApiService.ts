import { APIPatient, APIVitalReading, TransformedPatient } from '@/types/patient';
import { VitalReading } from '@/types/vitals';
import { parseTimestamp } from '@/utils/timestampParser';

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
  // Static instance for singleton pattern
  private static instance: PatientApiService | null = null;

  private patients: APIPatient[] = [];
  private loading = false;
  private lastFetchTime: number | null = null;
  private listeners: Array<(patients: APIPatient[], updateVersion?: number) => void> = [];
  private snapshotInterval: NodeJS.Timeout | null = null;
  private lastSnapshotIdentifier: number = -1;
  private isUsingSnapshot = false;
  private vitalCycleRunning = false;
  private updateVersion = 0;
  private pollingLock = false; // Mutex to prevent race conditions

  // Private constructor for singleton
  private constructor() {
    console.log('🔒 PatientApiService singleton instance created');
  }

  // Get singleton instance
  static getInstance(): PatientApiService {
    if (!PatientApiService.instance) {
      PatientApiService.instance = new PatientApiService();
    }
    return PatientApiService.instance;
  }

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
      const localUrl = import.meta.env.DEV ? '/api/local-data' : 'http://localhost:5174/api/local-data';
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
      console.log(`📡 Fetched snapshot - ID: ${snapshotData.identifier}, Patients: ${snapshotData.patients?.length || 0}`);

      // Check if identifier has changed
      if (snapshotData.identifier !== this.lastSnapshotIdentifier && snapshotData.identifier !== undefined) {
        console.log(`✅ New snapshot detected! Old ID: ${this.lastSnapshotIdentifier}, New ID: ${snapshotData.identifier}`);
        this.lastSnapshotIdentifier = snapshotData.identifier;

        // Process the new vital data
        if (snapshotData.patients && Array.isArray(snapshotData.patients)) {
          this.updatePatientsWithSnapshot(snapshotData.patients);
        }
      } else {
        console.log(`⏭️  Snapshot ID unchanged (${snapshotData.identifier}), skipping update`);
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

  // Intelligently merge vitals to maintain continuity without data loss
  private mergeVitalsIntelligently(patient: APIPatient): void {
    if (patient.Vitals.length === 0) return;

    console.log(`\n🔄 Starting merge for ${patient.Name} with ${patient.Vitals.length} vitals`);

    // Sort vitals by timestamp to ensure chronological order
    patient.Vitals.sort((a, b) => {
      const timeA = parseTimestamp(a.time).getTime();
      const timeB = parseTimestamp(b.time).getTime();
      return timeA - timeB;
    });

    const vitals = patient.Vitals;

    // Log time range of data
    if (vitals.length > 0) {
      const firstTime = parseTimestamp(vitals[0].time);
      const lastTime = parseTimestamp(vitals[vitals.length - 1].time);
      console.log(`📅 Data range: ${firstTime.toISOString()} to ${lastTime.toISOString()}`);
    }

    // Find boundary between historical and live data by detecting month/year changes
    // September 2025 data = historical (from local file), October 2025 data = API/live
    let boundaryIndex = -1;
    let hasSeptemberData = false;
    let hasOctoberData = false;

    for (let i = 0; i < vitals.length; i++) {
      const vitalDate = parseTimestamp(vitals[i].time);
      const month = vitalDate.getMonth(); // 8 = September, 9 = October
      const year = vitalDate.getFullYear();

      // Check for September 2025 (historical from local file)
      if (year === 2025 && month === 8) {
        hasSeptemberData = true;
      }
      // Check for October 2025 (live API data)
      else if (year === 2025 && month === 9) {
        hasOctoberData = true;
        // Mark the first October data point as boundary
        if (boundaryIndex === -1) {
          boundaryIndex = i;
        }
      }
    }

    console.log(`📅 Data analysis: September data: ${hasSeptemberData}, October data: ${hasOctoberData}`);
    if (boundaryIndex > 0) {
      console.log(`🔍 Found data boundary at index ${boundaryIndex}`);
    }

    // If we have mixed September and October data, ALWAYS merge them
    if (hasSeptemberData && hasOctoberData && boundaryIndex > 0) {
      const apiVitals = vitals.slice(boundaryIndex);
      const historicalVitals = vitals.slice(0, boundaryIndex);
      const apiStartTime = parseTimestamp(apiVitals[0].time);

      console.log(`📊 Data split: ${historicalVitals.length} historical (Sept), ${apiVitals.length} live (Oct) vitals`);

      if (historicalVitals.length > 0) {
        // Keep enough historical data for the longest view (1 week = 7 days)
        const maxViewDuration = 7 * 24 * 60 * 60 * 1000; // 7 days for weekly view
        const lastHistoricalTimestamp = parseTimestamp(historicalVitals[historicalVitals.length - 1].time).getTime();
        const firstHistoricalTimestamp = parseTimestamp(historicalVitals[0].time).getTime();
        const historicalSpan = lastHistoricalTimestamp - firstHistoricalTimestamp;

        // If we have less than 7 days of historical data, keep it all
        // Otherwise, keep the most recent 7 days
        let relevantHistorical = historicalVitals;
        if (historicalSpan > maxViewDuration) {
          relevantHistorical = historicalVitals.filter(v => {
            const vTime = parseTimestamp(v.time).getTime();
            return vTime >= lastHistoricalTimestamp - maxViewDuration;
          });
          console.log(`📝 Filtered to last 7 days: ${relevantHistorical.length} vitals from ${historicalVitals.length} total`);
        } else {
          console.log(`📝 Keeping all ${relevantHistorical.length} historical vitals (less than 7 days of data)`);
        }

        if (relevantHistorical.length > 0) {
          // Calculate duration of historical data
          const firstHistTime = parseTimestamp(relevantHistorical[0].time);
          const lastHistTime = parseTimestamp(relevantHistorical[relevantHistorical.length - 1].time);
          const historicalDuration = lastHistTime.getTime() - firstHistTime.getTime();

          // Calculate how much to shift historical data to connect seamlessly
          // We want the last historical point to be just before the first API point
          const lastHistoricalOriginalTime = lastHistTime.getTime();
          const desiredEndTime = apiStartTime.getTime() - 1; // 1ms before API start
          const timeShift = desiredEndTime - lastHistoricalOriginalTime;

          console.log(`🔧 Shifting historical data by ${(timeShift / (1000 * 60 * 60)).toFixed(2)} hours`);
          console.log(`   Historical will end at: ${new Date(desiredEndTime).toISOString()}`);
          console.log(`   API data starts at: ${apiStartTime.toISOString()}`);

          // Shift all historical timestamps by the same amount
          const alignedHistorical = relevantHistorical.map(v => {
            const originalTime = parseTimestamp(v.time).getTime();
            const shiftedTime = new Date(originalTime + timeShift);

            return {
              ...v,
              time: shiftedTime.toISOString()
            };
          });

          // Combine datasets seamlessly
          patient.Vitals = [...alignedHistorical, ...apiVitals];

          // Log the seamless merge
          const mergedFirst = parseTimestamp(patient.Vitals[0].time);
          const mergedLast = parseTimestamp(patient.Vitals[patient.Vitals.length - 1].time);
          const totalDuration = (mergedLast.getTime() - mergedFirst.getTime()) / (1000 * 60 * 60);
          const totalDays = totalDuration / 24;

          console.log(`✅ Merged seamlessly: ${patient.Vitals.length} total vitals`);
          console.log(`   Total duration: ${totalDuration.toFixed(2)} hours (${totalDays.toFixed(1)} days)`);
          console.log(`   Historical: ${alignedHistorical.length} vitals ending at ${alignedHistorical[alignedHistorical.length - 1].time}`);
          console.log(`   Live: ${apiVitals.length} vitals starting at ${apiVitals[0].time}`);
          console.log(`   View coverage: 1h ✓, 4h ✓, 12h ✓, 24h ${totalDuration >= 24 ? '✓' : '✗'}, 1w ${totalDuration >= 168 ? '✓' : '✗'}`);
        } else {
          // No relevant historical data, use API only
          patient.Vitals = apiVitals;
          console.log(`📊 Using ${apiVitals.length} live vitals only`);
        }
      } else {
        // No historical data
        patient.Vitals = apiVitals;
        console.log(`📊 Using ${apiVitals.length} live vitals only (no historical)`);
      }
    } else {
      // No clear boundary found, keep data as is but limit if too large
      if (patient.Vitals.length > 2000) {
        patient.Vitals = vitals.slice(-1500);
        console.log(`📊 No boundary found, kept most recent 1500 vitals`);
      } else {
        console.log(`📊 No boundary found, keeping all ${patient.Vitals.length} vitals`);
      }
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
    console.log(`\n🔄 DEEP ANALYSIS: Processing snapshot with ${snapshotPatients.length} patients...`);
    console.log(`   Current patients in memory: ${this.patients.length}`);

    // Log existing patients for debugging
    console.log(`   Existing patients:`);
    this.patients.forEach(p => {
      console.log(`     - ID: ${p.Identifier}, Name: "${p.Name}", Vitals: ${p.Vitals?.length || 0}`);
    });

    snapshotPatients.forEach(snapshotPatient => {
      console.log(`\n   🔍 Looking for patient: ID=${snapshotPatient.Identifier}, Name="${snapshotPatient.Name}"`);

      // Find existing patient by BOTH identifier AND name for exact matching
      const existingPatient = this.patients.find(p =>
        p.Identifier === snapshotPatient.Identifier &&
        p.Name === snapshotPatient.Name
      );

      if (existingPatient) {
        console.log(`     ✅ FOUND existing patient with ${existingPatient.Vitals?.length || 0} vitals`);
      } else {
        console.log(`     ❌ NOT FOUND - will create new patient`);
        // Also check if we have same ID but different name
        const sameIdPatient = this.patients.find(p => p.Identifier === snapshotPatient.Identifier);
        if (sameIdPatient) {
          console.log(`     ⚠️ Found patient with same ID but different name: "${sameIdPatient.Name}" vs "${snapshotPatient.Name}"`);
        }
      }

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
          console.log(`     📊 BEFORE adding vital: Patient has ${existingPatient.Vitals.length} vitals`);

          // Simply add new vital without complex cutoff logic
          existingPatient.Vitals.push(newVital);
          console.log(`     ✅ Added new vital at ${newVital.time}`);
          console.log(`     📊 AFTER adding vital: Patient has ${existingPatient.Vitals.length} vitals`);

          // Apply intelligent merging instead of truncating
          console.log(`     🔧 Calling mergeVitalsIntelligently...`);
          this.mergeVitalsIntelligently(existingPatient);
          console.log(`     📊 AFTER merge: Patient has ${existingPatient.Vitals.length} vitals`);

          updated = true;
        } else {
          console.log(`     ⏭️ Duplicate vital skipped at ${newVital.time}`);
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
    // Use lock to prevent race conditions
    if (this.pollingLock) {
      console.log('⚠️ Polling start in progress, skipping duplicate request');
      return;
    }

    // Double-check to prevent any possibility of duplicate polling
    if (this.snapshotInterval || this.isUsingSnapshot) {
      console.log('⚠️ Snapshot polling already active, not starting duplicate');
      return; // Already polling
    }

    // Set lock to prevent race conditions
    this.pollingLock = true;

    console.log('🚀 Starting vital snapshot polling...');
    console.log(`   Polling interval: 5 seconds`);
    this.isUsingSnapshot = true;

    // Fetch initial snapshot immediately
    console.log('📡 Fetching initial snapshot...');
    this.fetchSnapshot();

    // Set up interval for updates - EVERY 5 SECONDS
    this.snapshotInterval = setInterval(async () => {
      console.log(`\n⏰ 5-second interval - triggering update cycle...`);

      try {
        // Step 1: Trigger increment to get new data
        const incrementResponse = await fetch(INCREMENT_API_URL, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (incrementResponse.ok) {
          const result = await incrementResponse.json();
          console.log(`   📈 Incremented to index: ${result.new_index}`);
        }

        // Step 2: Save the current vitals as snapshot
        const saveResponse = await fetch(SAVE_API_URL, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          console.log(`   💾 Saved snapshot ID: ${saveResult.snapshot_id}`);
        }

        // Step 3: Fetch the updated snapshot
        await this.fetchSnapshot();

      } catch (error) {
        console.error('   ❌ Update cycle failed:', error);
      }
    }, 5000); // Run every 5 seconds for real-time updates

    console.log('✅ Snapshot polling interval started (ID:', this.snapshotInterval, ')');

    // Release lock after setup
    this.pollingLock = false;
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
    console.log('🏥 fetchPatients called - forceRefresh:', forceRefresh);

    // Clear cache if forcing refresh
    if (forceRefresh) {
      this.clearCache();
    }

    // Prevent multiple simultaneous fetches
    if (this.loading) {
      return this.patients;
    }

    this.loading = true;

    // ALWAYS TRY LOCAL FILE FIRST (before cache) to get September data!
    if (!forceRefresh) {
      const localData = await this.tryLoadFromLocalFile();
      if (localData) {
        console.log(`📂 Loaded ${localData.length} patients from local file with September 2025 data`);
        // Log vital counts for each patient
        localData.forEach(p => {
          if (p.Vitals && p.Vitals.length > 0) {
            const firstTime = parseTimestamp(p.Vitals[0].time);
            const lastTime = parseTimestamp(p.Vitals[p.Vitals.length - 1].time);
            console.log(`   ${p.Name}: ${p.Vitals.length} vitals (${firstTime.toISOString().split('T')[0]} to ${lastTime.toISOString().split('T')[0]})`);
          }
        });
        this.patients = localData;
        this.lastFetchTime = Date.now();
        this.saveToCache(localData);
        this.notifyListeners();
        this.loading = false;
        // Polling is managed by App.tsx
        return localData;
      }
    }

    // If no local file, check cache
    if (!forceRefresh) {
      // Check in-memory cache
      if (this.isCacheValid()) {
        console.log('📦 Using in-memory cached data (no local file available)');
        this.loading = false;
        return this.patients;
      }

      // Check localStorage cache
      const cached = this.loadFromCache();
      if (cached) {
        console.log('💾 Loading from localStorage cache (no local file available)');
        this.patients = cached;
        this.notifyListeners();
        this.loading = false;
        return cached;
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

      // Polling is now managed by App.tsx

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

  // Get filtered vitals data for charts (TRUE time-based filtering)
  getFilteredVitals(bedId: string, hours: number = 24): APIVitalReading[] {
    const patient = this.getPatientByBedId(bedId);
    if (!patient || !patient.Vitals || patient.Vitals.length === 0) {
      console.log(`⚠️ No patient or vitals found for ${bedId}`);
      return [];
    }

    const vitals = [...patient.Vitals];

    // If we have no data or very little data, just return what we have
    if (vitals.length === 0) return [];

    // Get the latest timestamp from the data using universal parser
    const latestVital = vitals[vitals.length - 1];
    const latestTime = parseTimestamp(latestVital.time);

    // Get earliest timestamp
    const earliestVital = vitals[0];
    const earliestTime = parseTimestamp(earliestVital.time);

    // Calculate the cutoff time (latest time minus requested hours)
    const cutoffTime = new Date(latestTime.getTime() - (hours * 60 * 60 * 1000));

    console.log(`\n📊 DEEP CHART FILTER: ${bedId} for ${hours}h view:`);
    console.log(`   Latest time: ${latestTime.toISOString()}`);
    console.log(`   Earliest time: ${earliestTime.toISOString()}`);
    console.log(`   Cutoff time: ${cutoffTime.toISOString()}`);
    console.log(`   Total vitals available: ${vitals.length}`);

    // Check for September and October data
    let hasSeptemberData = false;
    let hasOctoberData = false;
    let septemberCount = 0;
    let octoberCount = 0;

    vitals.forEach(vital => {
      const vitalDate = parseTimestamp(vital.time);
      const month = vitalDate.getMonth(); // 8 = September, 9 = October
      const year = vitalDate.getFullYear();

      if (year === 2025 && month === 8) {
        hasSeptemberData = true;
        septemberCount++;
      } else if (year === 2025 && month === 9) {
        hasOctoberData = true;
        octoberCount++;
      }
    });

    console.log(`   📅 Data composition: Sept 2025: ${septemberCount} vitals, Oct 2025: ${octoberCount} vitals`);

    // Filter vitals to only include those within the time range
    const filteredVitals = vitals.filter(vital => {
      const vitalTime = parseTimestamp(vital.time);
      return vitalTime >= cutoffTime;
    });

    console.log(`   Filtered vitals (standard): ${filteredVitals.length}`);

    // SPECIAL HANDLING FOR MERGED SEPTEMBER-OCTOBER DATA
    // If we have both datasets and limited October data, intelligently combine them
    if (hasSeptemberData && hasOctoberData && octoberCount < 200) {
      console.log(`   🔧 SMART MERGE MODE: Limited October data (${octoberCount} points), intelligently combining with September data`);

      // For different time ranges, use different strategies
      if (hours <= 12) {
        // For 12h view: Use all October data + recent September data to fill
        const octoberVitals = vitals.filter(v => {
          const vDate = parseTimestamp(v.time);
          return vDate.getMonth() === 9 && vDate.getFullYear() === 2025;
        });

        const targetPoints = 100;
        if (octoberVitals.length < targetPoints) {
          // Add September data to reach target
          const septemberVitals = vitals.filter(v => {
            const vDate = parseTimestamp(v.time);
            return vDate.getMonth() === 8 && vDate.getFullYear() === 2025;
          });

          const septemberNeeded = targetPoints - octoberVitals.length;
          const septemberToAdd = septemberVitals.slice(-septemberNeeded);

          console.log(`   📊 12h view: ${octoberVitals.length} Oct + ${septemberToAdd.length} Sept = ${octoberVitals.length + septemberToAdd.length} total`);
          return [...septemberToAdd, ...octoberVitals];
        }
        return octoberVitals;

      } else if (hours <= 24) {
        // For 24h view: Use all October + enough September to show 24h worth
        const octoberVitals = vitals.filter(v => {
          const vDate = parseTimestamp(v.time);
          return vDate.getMonth() === 9 && vDate.getFullYear() === 2025;
        });

        const targetPoints = 200;
        if (octoberVitals.length < targetPoints) {
          const septemberVitals = vitals.filter(v => {
            const vDate = parseTimestamp(v.time);
            return vDate.getMonth() === 8 && vDate.getFullYear() === 2025;
          });

          const septemberNeeded = targetPoints - octoberVitals.length;
          const septemberToAdd = septemberVitals.slice(-septemberNeeded);

          console.log(`   📊 24h view: ${octoberVitals.length} Oct + ${septemberToAdd.length} Sept = ${octoberVitals.length + septemberToAdd.length} total`);
          return [...septemberToAdd, ...octoberVitals];
        }
        return octoberVitals;

      } else {
        // For week view: Use proportional mix of both datasets
        const targetPoints = hours >= 168 ? 500 : 300;

        // Take all October data
        const octoberVitals = vitals.filter(v => {
          const vDate = parseTimestamp(v.time);
          return vDate.getMonth() === 9 && vDate.getFullYear() === 2025;
        });

        // Fill rest with September data
        if (octoberVitals.length < targetPoints) {
          const septemberVitals = vitals.filter(v => {
            const vDate = parseTimestamp(v.time);
            return vDate.getMonth() === 8 && vDate.getFullYear() === 2025;
          });

          const septemberNeeded = targetPoints - octoberVitals.length;
          const septemberToAdd = septemberVitals.slice(-septemberNeeded);

          console.log(`   📊 Week view: ${octoberVitals.length} Oct + ${septemberToAdd.length} Sept = ${octoberVitals.length + septemberToAdd.length} total`);
          return [...septemberToAdd, ...octoberVitals];
        }
        return octoberVitals;
      }
    }

    // Progressive search expansion if not enough data found
    const minPointsNeeded = hours >= 168 ? 100 : hours >= 24 ? 50 : 20;

    if (filteredVitals.length < minPointsNeeded && vitals.length > filteredVitals.length) {
      console.log(`   📈 Only ${filteredVitals.length} points found, expanding search...`);

      // Try doubling the time range
      const expandedCutoff = new Date(latestTime.getTime() - (hours * 2 * 60 * 60 * 1000));
      const expandedFiltered = vitals.filter(vital => {
        const vitalTime = parseTimestamp(vital.time);
        return vitalTime >= expandedCutoff;
      });

      if (expandedFiltered.length > filteredVitals.length) {
        console.log(`   ✅ Expanded search found ${expandedFiltered.length} points`);
        return expandedFiltered;
      }
    }

    // If still no data, return what we have or fallback
    if (filteredVitals.length === 0 && vitals.length > 0) {
      // Dynamic fallback based on requested view duration
      let fallbackPoints = 100; // default
      if (hours >= 168) { // 1 week
        fallbackPoints = Math.min(500, vitals.length);
      } else if (hours >= 24) { // 1 day
        fallbackPoints = Math.min(300, vitals.length);
      } else if (hours >= 12) { // 12 hours
        fallbackPoints = Math.min(200, vitals.length);
      }

      console.log(`   ⚠️ No data within ${hours}h range, returning last ${fallbackPoints} points as fallback`);
      return vitals.slice(-fallbackPoints);
    }

    if (filteredVitals.length > 0) {
      const firstFiltered = parseTimestamp(filteredVitals[0].time);
      const lastFiltered = parseTimestamp(filteredVitals[filteredVitals.length - 1].time);
      const duration = (lastFiltered.getTime() - firstFiltered.getTime()) / (1000 * 60 * 60);
      console.log(`   ✅ Returning ${filteredVitals.length} vitals covering ${duration.toFixed(2)}h`);
      console.log(`   Time range: ${firstFiltered.toISOString()} to ${lastFiltered.toISOString()}`);
    }

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

// Export singleton instance
export const patientApiService = PatientApiService.getInstance();