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

class VitalsService {
  private data: VitalsData = { readings: [] };
  private listeners: Array<(data: VitalsData) => void> = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastReadingCount = 0;

  async loadInitialData(): Promise<VitalsData> {
    try {
      const response = await fetch('/vitals.json');
      if (response.ok) {
        this.data = await response.json();
        this.lastReadingCount = this.data.readings.length;
        
        // If file is empty or has no recent data, generate demo data
        if (this.data.readings.length === 0 || this.hasOnlyOldData()) {
          console.log('No recent data found, generating demo data');
          this.data = this.generateDemoData();
        }
      } else {
        // Generate demo data if file doesn't exist
        this.data = this.generateDemoData();
      }
    } catch (error) {
      console.log('Using demo data:', error);
      this.data = this.generateDemoData();
    }
    
    this.notifyListeners();
    return this.data;
  }

  startPolling(): void {
    if (this.pollingInterval) return;
    
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch('/vitals.json');
        if (response.ok) {
          const newData: VitalsData = await response.json();
          if (newData.readings.length > this.lastReadingCount) {
            this.data = newData;
            this.lastReadingCount = newData.readings.length;
            this.notifyListeners();
          }
        } else {
          // Continue generating demo data
          this.appendDemoReading();
        }
      } catch (error) {
        // Continue generating demo data
        this.appendDemoReading();
      }
    }, 1000);
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

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.data));
  }

  private generateDemoData(): VitalsData {
    const readings: VitalTimestamp[] = [];
    const beds = ['bed_15', 'bed_16', 'bed_17', 'bed_18', 'bed_19', 'bed_20', 'bed_21', 'bed_22', 'bed_23', 'bed_24', 'bed_25', 'bed_26'];
    
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
    const beds = ['bed_15', 'bed_16', 'bed_17', 'bed_18', 'bed_19', 'bed_20', 'bed_21', 'bed_22', 'bed_23', 'bed_24', 'bed_25', 'bed_26'];
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

  getLatestReading(bedId: string = 'bed_15'): VitalReading | null {
    if (this.data.readings.length === 0) return null;
    const latest = this.data.readings[this.data.readings.length - 1];
    return (latest[bedId] as VitalReading) || null;
  }

  getFilteredData(bedId: string = 'bed_15', timeRange: string = '24h'): Array<{ timestamp: string; vital: VitalReading }> {
    if (this.data.readings.length === 0) return [];
    
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '4h':
        startTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        break;
      case '12h':
        startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1w':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const filtered = this.data.readings
      .filter(reading => new Date(reading.timestamp) >= startTime)
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
    
    return filtered;
  }
}

export const vitalsService = new VitalsService();