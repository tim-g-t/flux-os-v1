export interface APIPatient {
  Identifier: number;
  Name: string;
  Bed: string;
  Gender: string;
  Age: number;
  Vitals: APIVitalReading[];
}

export interface APIVitalReading {
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

export interface TransformedPatient {
  id: string;
  identifier: number;
  name: string;
  bed: string;
  age: number;
  gender: string;
  vitals: APIVitalReading[];
}