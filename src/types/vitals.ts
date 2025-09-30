// Vital signs reading interface
export interface VitalReading {
  hr: number;       // Heart Rate (30-200)
  bps: number;      // Blood Pressure Systolic (80-200)
  bpd: number;      // Blood Pressure Diastolic (40-120)
  rr: number;       // Respiratory Rate (8-40)
  temp: number;     // Temperature Fahrenheit (95-105)
  spo2: number;     // SpO2 percentage (70-100)
}

// Vital timestamp interface (for historical data)
export interface VitalTimestamp {
  timestamp: string;
  vital: VitalReading;
}

// Vitals data structure (for compatibility)
export interface VitalsData {
  readings: VitalTimestamp[];
}