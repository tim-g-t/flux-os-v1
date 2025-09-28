export interface VitalReading {
  hr: number;       // Heart Rate (30-200)
  bps: number;      // Blood Pressure Systolic (80-200)
  bpd: number;      // Blood Pressure Diastolic (40-120)
  rr: number;       // Respiratory Rate (8-40)
  temp: number;     // Temperature Fahrenheit (95-105)
  spo2: number;     // SpO2 percentage (70-100)
}

export interface VitalTimestamp {
  timestamp: string;
  [key: string]: VitalReading | string; // bed_15, bed_16, etc.
}

export interface VitalsData {
  readings: VitalTimestamp[];
}

// New interfaces for external server format
export interface ServerVitalReading {
  time: string;
  Pulse: number;
  BloodPressure: {
    Systolic: number;
    Diastolic: number;
    Mean: number;
  };
  RespirationRate: number;
  SpO2: number;
  Temp: number;
}

export interface PatientResponse {
  Identifier: number;
  Name: string;
  Bed: string;
  Gender: string;
  Age: number;
  Vitals: ServerVitalReading[]; // Array of vital readings
}

export interface PatientData {
  id: string;
  name: string;
  bed: string;
  gender: string;
  age: number;
  condition?: string;
  admissionDate?: string;
  currentVitals?: VitalReading;
  vitalHistory?: Array<{ timestamp: string; vital: VitalReading }>;
  alerts?: string[];
  medications?: string[];
  notes?: string[];
}

export interface ServerResponse {
  patients?: PatientResponse[];
  data?: PatientResponse[];
  // Support multiple possible response formats
}

export interface DataSourceConfig {
  type: 'local' | 'server';
  url: string;
  pollInterval?: number;
}

class VitalsService {
  private data: VitalsData = { readings: [] };
  private patients: PatientData[] = [];
  private listeners: Array<(data: VitalsData) => void> = [];
  private patientListeners: Array<(patients: PatientData[]) => void> = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastReadingCount = 0;
  private config: DataSourceConfig = {
    type: 'local',
    url: '/patients.json', // Default to new format
    pollInterval: 1000
  };

  // Configure data source
  setDataSource(config: DataSourceConfig): void {
    this.config = config;
    this.stopPolling(); // Stop current polling if any
  }

  async loadInitialData(): Promise<VitalsData> {
    try {
      if (this.config.type === 'server') {
        await this.loadFromServer();
      } else {
        await this.loadFromLocal();
      }
    } catch (error) {
      console.log('Failed to load data, using demo data:', error);
      this.data = this.generateDemoData();
      this.generateDemoPatients();
    }
    
    this.notifyListeners();
    this.notifyPatientListeners();
    return this.data;
  }

  private async loadFromServer(): Promise<void> {
    if (!this.config?.url) {
      throw new Error('Server URL not configured');
    }

    try {
      console.log('📡 VitalsService: Loading from server:', this.config.url);
      console.log('⏳ Large dataset loading - this may take several seconds...');
      
      // Set longer timeout for large datasets (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(this.config.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      console.log('📡 Response received, parsing JSON data...');
      const responseData = await response.json();
      console.log('📊 VitalsService: Raw server data received, size:', JSON.stringify(responseData).length, 'characters');
      
      // Check if the response is a direct array or wrapped in an object
      let serverData: ServerResponse;
      if (Array.isArray(responseData)) {
        // Direct array of patients from API
        serverData = { data: responseData };
        console.log('Server response received:', responseData.length, 'patients');
      } else {
        // Already wrapped in an object
        serverData = responseData;
        console.log('Server response received:', serverData.data?.length || 'unknown', 'patients');
      }
      
      console.log('🔄 Processing server data...');
      this.transformServerData(serverData);
      console.log('✅ VitalsService: Server data processed successfully');
      console.log('👥 Patients loaded:', this.patients.length);
      
    } catch (error) {
      console.error('❌ VitalsService: Error loading from server:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - the server took too long to respond (>30s)');
        }
        throw new Error(`Server loading failed: ${error.message}`);
      }
      throw error;
    }
  }

  private async loadFromLocal(): Promise<void> {
    const response = await fetch(this.config.url);
    if (response.ok) {
      const localData = await response.json();
      
      // Check if it's the old format (VitalsData) or new format (PatientResponse[])
      if (localData.readings) {
        // Old format - vitals.json
        this.data = localData;
        this.lastReadingCount = this.data.readings.length;
        
        if (this.data.readings.length === 0 || this.hasOnlyOldData()) {
          console.log('No recent data found, generating demo data');
          this.data = this.generateDemoData();
          this.generateDemoPatients();
        } else {
          this.extractPatientsFromVitalsData();
        }
      } else if (Array.isArray(localData)) {
        // Check if it's the new server format with Vitals array or old format with Vital object
        if (localData.length > 0 && localData[0].Vitals) {
          // New server format - array of PatientResponse with Vitals array
          this.transformServerData({ data: localData });
        } else if (localData.length > 0 && localData[0].Vital) {
          // Old patient format - array of PatientResponse with Vital object
          this.transformServerData({ patients: localData });
        } else {
          throw new Error('Unknown patient data format');
        }
      } else {
        throw new Error('Unknown data format');
      }
    } else {
      throw new Error(`Local file not found: ${this.config.url}`);
    }
  }

  private transformServerData(serverData: ServerResponse): void {
    console.log('🔄 Transforming server data...');
    const patientArray = serverData.patients || serverData.data || [];
    console.log('📊 Patient array length:', patientArray.length);
    
    this.patients = patientArray.map((patient, index) => {
      // Extract bed number from various formats (Bed_1, bed_01, etc.)
      const bedMatch = patient.Bed.match(/\d+/);
      const bedNumber = bedMatch ? bedMatch[0].padStart(2, '0') : (index + 1).toString().padStart(2, '0');
      const patientId = `bed_${bedNumber}`;
      
      console.log(`👤 Processing patient ${patient.Name} - Bed: ${patient.Bed} -> ID: ${patientId}`);
      
      const patientData: PatientData = {
        id: patientId,
        name: patient.Name,
        bed: patient.Bed,
        gender: patient.Gender,
        age: patient.Age,
        condition: 'Stable',
        admissionDate: new Date().toISOString().split('T')[0],
        vitalHistory: [],
        alerts: [],
        medications: [],
        notes: []
      };

      // Extract vital readings from the Vitals array
      if (patient.Vitals && Array.isArray(patient.Vitals)) {
        console.log(`📈 Processing ${patient.Vitals.length} vital readings for ${patientId}`);
        const vitalHistory: Array<{ timestamp: string; vital: VitalReading }> = [];
        
        patient.Vitals.forEach(serverVital => {
          const vital = this.parseServerVitalReading(serverVital);
          if (vital) {
            vitalHistory.push({
              timestamp: serverVital.time,
              vital
            });
          }
        });

        patientData.vitalHistory = vitalHistory.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Set current vitals to the most recent reading
        if (vitalHistory.length > 0) {
          patientData.currentVitals = vitalHistory[vitalHistory.length - 1].vital;
          console.log(`✅ Set current vitals for ${patientId}:`, patientData.currentVitals);
        }
      } else {
        console.log(`⚠️ No vitals data found for patient ${patientId}`);
      }

      return patientData;
    });

    console.log('✅ All patients processed:', this.patients.map(p => `${p.id}(${p.vitalHistory?.length || 0} readings)`));
    
    // Always convert patient data to VitalsData format for backward compatibility  
    this.convertPatientsToVitalsData();
    console.log('🔄 Data conversion to VitalsData format complete');
  }

  private parseServerVitalReading(serverVital: ServerVitalReading): VitalReading | null {
    try {
      return {
        hr: Number(serverVital.Pulse),
        bps: Number(serverVital.BloodPressure.Systolic),
        bpd: Number(serverVital.BloodPressure.Diastolic),
        rr: Number(serverVital.RespirationRate),
        temp: Number(serverVital.Temp),
        spo2: Number(serverVital.SpO2)
      };
    } catch {
      return null;
    }
  }

  private parseVitalReading(vitalData: any): VitalReading | null {
    try {
      return {
        hr: Number(vitalData.hr || vitalData.heartRate || 75),
        bps: Number(vitalData.bps || vitalData.systolic || 120),
        bpd: Number(vitalData.bpd || vitalData.diastolic || 80),
        rr: Number(vitalData.rr || vitalData.respiratoryRate || 16),
        temp: Number(vitalData.temp || vitalData.temperature || 98.6),
        spo2: Number(vitalData.spo2 || vitalData.oxygenSaturation || 98)
      };
    } catch {
      return null;
    }
  }

  private convertPatientsToVitalsData(): void {
    const readings: VitalTimestamp[] = [];
    
    // Get all unique timestamps from all patients
    const allTimestamps = new Set<string>();
    this.patients.forEach(patient => {
      patient.vitalHistory?.forEach(reading => {
        allTimestamps.add(reading.timestamp);
      });
    });

    // Create VitalTimestamp objects
    Array.from(allTimestamps).sort().forEach(timestamp => {
      const reading: VitalTimestamp = { timestamp };
      
      this.patients.forEach(patient => {
        const vitalAtTime = patient.vitalHistory?.find(v => v.timestamp === timestamp);
        if (vitalAtTime) {
          reading[patient.id] = vitalAtTime.vital;
        }
      });

      if (Object.keys(reading).length > 1) { // More than just timestamp
        readings.push(reading);
      }
    });

    this.data = { readings };
    this.lastReadingCount = readings.length;
  }

  private extractPatientsFromVitalsData(): void {
    // Extract patient list from existing vitals data
    const patientIds = new Set<string>();
    
    this.data.readings.forEach(reading => {
      Object.keys(reading).forEach(key => {
        if (key !== 'timestamp') {
          patientIds.add(key);
        }
      });
    });

    this.patients = Array.from(patientIds).map((id, index) => ({
      id,
      name: `Patient ${id.replace('bed_', '')}`,
      bed: id.replace('_', ' ').toUpperCase(),
      gender: index % 2 === 0 ? 'Male' : 'Female',
      age: 30 + Math.floor(Math.random() * 50),
      vitalHistory: this.getFilteredData(id, '24h')
    }));
  }

  private generateDemoPatients(): void {
    const names = ['Simon A.', 'Maria C.', 'David L.', 'Robert M.', 'Sarah K.', 'Anna T.', 'Elena R.', 'James P.'];
    
    this.patients = names.map((name, index) => ({
      id: `bed_${(index + 1).toString().padStart(2, '0')}`,
      name,
      bed: `Bed ${index + 1}`,
      gender: index % 2 === 0 ? 'Male' : 'Female',
      age: 25 + Math.floor(Math.random() * 50),
      vitalHistory: []
    }));
  }

  startPolling(): void {
    if (this.pollingInterval) return;
    
    const interval = this.config.pollInterval || 1000;
    
    this.pollingInterval = setInterval(async () => {
      try {
        if (this.config.type === 'server') {
          await this.loadFromServer();
          this.notifyListeners();
          this.notifyPatientListeners();
        } else {
          // Local polling behavior
          const response = await fetch(this.config.url);
          if (response.ok) {
            const newData: VitalsData = await response.json();
            if (newData.readings && newData.readings.length > this.lastReadingCount) {
              this.data = newData;
              this.lastReadingCount = newData.readings.length;
              this.extractPatientsFromVitalsData();
              this.notifyListeners();
              this.notifyPatientListeners();
            }
          } else {
            this.appendDemoReading();
          }
        }
      } catch (error) {
        // Continue generating demo data
        this.appendDemoReading();
      }
    }, interval);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  subscribe(callback: (data: VitalsData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  subscribeToPatients(callback: (patients: PatientData[]) => void): () => void {
    this.patientListeners.push(callback);
    return () => {
      this.patientListeners = this.patientListeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.data));
  }

  private notifyPatientListeners(): void {
    this.patientListeners.forEach(listener => listener(this.patients));
  }

  private generateDemoData(): VitalsData {
    const readings: VitalTimestamp[] = [];
    const beds = ['bed_01', 'bed_02', 'bed_03', 'bed_04', 'bed_05', 'bed_06', 'bed_07', 'bed_08'];
    
    // Generate last 24 hours of data (every 30 seconds for demo)
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Generate every 30 seconds for last 24 hours = 2,880 readings
    const intervalMs = 30 * 1000; // 30 seconds
    const totalReadings = Math.floor((24 * 60 * 60 * 1000) / intervalMs);
    
    for (let i = 0; i < totalReadings; i++) {
      const timestamp = new Date(startTime.getTime() + i * intervalMs);
      const reading: VitalTimestamp = {
        timestamp: timestamp.toISOString()
      };
      
      beds.forEach(bed => {
        reading[bed] = this.generateVitalReading(i, bed);
      });
      
      readings.push(reading);
    }
    
    return { readings };
  }

  private generateVitalReading(index: number, bedId: string): VitalReading {
    // Seed based on bed for consistency
    const bedSeed = bedId.charCodeAt(bedId.length - 1);
    const timeSeed = index;
    
    // Base values with some per-bed variation
    const baseHR = 70 + (bedSeed % 10);
    const baseBPS = 120 + (bedSeed % 20);
    const baseBPD = 80 + (bedSeed % 10);
    const baseRR = 16 + (bedSeed % 4);
    const baseTemp = 98.6 + ((bedSeed % 10) - 5) * 0.1;
    const baseSpo2 = 97 + (bedSeed % 3);
    
    // Add natural variations and circadian rhythms
    const hourOfDay = Math.floor((timeSeed * 10) / 1000 / 3600) % 24;
    const circadianFactor = Math.sin((hourOfDay - 6) * Math.PI / 12) * 0.1;
    
    // Random variations
    const hrVariation = Math.sin(timeSeed * 0.01) * 15 + Math.random() * 10 - 5;
    const bpVariation = Math.sin(timeSeed * 0.008) * 10 + Math.random() * 8 - 4;
    const tempVariation = Math.sin(timeSeed * 0.002) * 0.5 + Math.random() * 0.4 - 0.2;
    const rrVariation = Math.sin(timeSeed * 0.015) * 3 + Math.random() * 2 - 1;
    const spo2Variation = Math.random() * 3 - 1;
    
    // Occasional anomalies (every ~100 readings)
    const anomaly = Math.random() < 0.01;
    const anomalyMultiplier = anomaly ? (Math.random() > 0.5 ? 1.3 : 0.7) : 1;
    
    return {
      hr: Math.round(Math.max(30, Math.min(200, (baseHR + hrVariation + circadianFactor * 10) * anomalyMultiplier))),
      bps: Math.round(Math.max(80, Math.min(200, (baseBPS + bpVariation + circadianFactor * 5) * anomalyMultiplier))),
      bpd: Math.round(Math.max(40, Math.min(120, (baseBPD + bpVariation * 0.6 + circadianFactor * 3) * anomalyMultiplier))),
      rr: Math.round(Math.max(8, Math.min(40, (baseRR + rrVariation) * anomalyMultiplier))),
      temp: Math.round((Math.max(95, Math.min(105, baseTemp + tempVariation + circadianFactor * 0.3)) * anomalyMultiplier) * 10) / 10,
      spo2: Math.round(Math.max(70, Math.min(100, (baseSpo2 + spo2Variation - circadianFactor * 2) * (anomaly ? 0.9 : 1))))
    };
  }

  private appendDemoReading(): void {
    const beds = ['bed_01', 'bed_02', 'bed_03', 'bed_04', 'bed_05', 'bed_06', 'bed_07', 'bed_08'];
    const timestamp = new Date().toISOString();
    const index = this.data.readings.length;
    
    const reading: VitalTimestamp = { timestamp };
    
    beds.forEach(bed => {
      reading[bed] = this.generateVitalReading(index, bed);
    });
    
    this.data.readings.push(reading);
    this.lastReadingCount = this.data.readings.length;
    this.notifyListeners();
  }

  private hasOnlyOldData(): boolean {
    if (this.data.readings.length === 0) return true;
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Check if the most recent reading is older than 1 day
    const mostRecent = this.data.readings[this.data.readings.length - 1];
    return new Date(mostRecent.timestamp) < oneDayAgo;
  }

  getData(): VitalsData {
    return this.data;
  }

  getPatients(): PatientData[] {
    return this.patients;
  }

  getPatient(patientId: string): PatientData | null {
    console.log(`🔍 Looking for patient: ${patientId}`);
    const patient = this.patients.find(p => p.id === patientId);
    if (patient) {
      console.log(`✅ Found patient ${patientId}:`, patient.name, `with ${patient.vitalHistory?.length || 0} vital readings`);
    } else {
      console.log(`❌ Patient ${patientId} not found. Available patients:`, this.patients.map(p => p.id));
    }
    return patient || null;
  }

  getLatestReading(bedId: string = 'bed_01'): VitalReading | null {
    // First try to get from patient data
    const patient = this.getPatient(bedId);
    if (patient?.currentVitals) {
      return patient.currentVitals;
    }

    // Fallback to vitals data
    if (this.data.readings.length === 0) return null;
    const latest = this.data.readings[this.data.readings.length - 1];
    return (latest[bedId] as VitalReading) || null;
  }

  getFilteredData(bedId: string = 'bed_01', timeRange: string = '24h'): Array<{ timestamp: string; vital: VitalReading }> {
    console.log(`📊 Getting filtered data for ${bedId}, timeRange: ${timeRange}`);
    
    // First try to get from patient data
    const patient = this.getPatient(bedId);
    if (patient?.vitalHistory && patient.vitalHistory.length > 0) {
      console.log(`✅ Using patient data for ${bedId}: ${patient.vitalHistory.length} readings`);
      
      // For historical data, determine the time range based on the actual data
      const allTimes = patient.vitalHistory.map(reading => new Date(reading.timestamp));
      const minTime = new Date(Math.min(...allTimes.map(t => t.getTime())));
      const maxTime = new Date(Math.max(...allTimes.map(t => t.getTime())));
      
      console.log(`📅 Data range: ${minTime.toISOString()} to ${maxTime.toISOString()}`);
      
      // Calculate time range from the latest data point backwards
      let startTime: Date;
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(maxTime.getTime() - 60 * 60 * 1000);
          break;
        case '4h':
          startTime = new Date(maxTime.getTime() - 4 * 60 * 60 * 1000);
          break;
        case '12h':
          startTime = new Date(maxTime.getTime() - 12 * 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(maxTime.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '1w':
          startTime = new Date(maxTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(maxTime.getTime() - 24 * 60 * 60 * 1000);
      }
      
      // Ensure we don't go before the actual data start
      if (startTime < minTime) {
        startTime = minTime;
      }
      
      console.log(`🕐 Filtering from ${startTime.toISOString()} to ${maxTime.toISOString()}`);
      
      const filtered = patient.vitalHistory.filter(reading => {
        const readingTime = new Date(reading.timestamp);
        return readingTime >= startTime && readingTime <= maxTime;
      });
      
      console.log(`📈 Filtered to ${filtered.length} readings for timeRange ${timeRange}`);
      
      // Subsample for performance (max 200 points)
      if (filtered.length > 200) {
        const step = Math.floor(filtered.length / 200);
        const subsampled = filtered.filter((_, index) => index % step === 0);
        console.log(`🎯 Subsampled from ${filtered.length} to ${subsampled.length} points`);
        return subsampled;
      }
      
      return filtered;
    }
    
    // Fallback to old VitalsData format
    console.log(`⚠️ No patient data found for ${bedId}, trying VitalsData format`);
    if (this.data.readings.length === 0) {
      console.log(`❌ No data available at all`);
      return [];
    }
    
    // For historical data in VitalsData format, use the same approach
    const allTimes = this.data.readings.map(reading => new Date(reading.timestamp));
    const maxTime = new Date(Math.max(...allTimes.map(t => t.getTime())));
    
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(maxTime.getTime() - 60 * 60 * 1000);
        break;
      case '4h':
        startTime = new Date(maxTime.getTime() - 4 * 60 * 60 * 1000);
        break;
      case '12h':
        startTime = new Date(maxTime.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(maxTime.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1w':
        startTime = new Date(maxTime.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(maxTime.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const filtered = this.data.readings
      .filter(reading => {
        const readingTime = new Date(reading.timestamp);
        return readingTime >= startTime && readingTime <= maxTime;
      })
      .map(reading => ({
        timestamp: reading.timestamp,
        vital: reading[bedId] as VitalReading
      }))
      .filter(item => item.vital);
    
    // Subsample for performance (max 200 points)
    if (filtered.length > 200) {
      const step = Math.floor(filtered.length / 200);
      return filtered.filter((_, index) => index % step === 0);
    }
    
    console.log(`📊 Returning ${filtered.length} data points from VitalsData for ${bedId}`);
    return filtered;
  }
}

export const vitalsService = new VitalsService();