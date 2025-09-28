import { VitalReading } from '@/services/vitalsService';

// Patient demographic data
export interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  admissionDate: string;
  duration: string;
  backgroundImage: string;
  riskLevel: 'normal' | 'warning' | 'critical';
}

// Test patients with different risk profiles
export const testPatients: PatientInfo[] = [
  {
    id: 'bed_01',
    name: 'Simon A.',
    age: 45,
    gender: 'Male',
    admissionDate: '2024-01-10T08:30:00Z',
    duration: '142h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'normal'
  },
  {
    id: 'bed_02',
    name: 'Maria C.',
    age: 62,
    gender: 'Female',
    admissionDate: '2024-01-11T14:15:00Z',
    duration: '118h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'normal'
  },
  {
    id: 'bed_03',
    name: 'David L.',
    age: 38,
    gender: 'Male',
    admissionDate: '2024-01-12T09:00:00Z',
    duration: '95h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'normal'
  },
  {
    id: 'bed_04',
    name: 'Robert M.',
    age: 71,
    gender: 'Male',
    admissionDate: '2024-01-13T16:45:00Z',
    duration: '72h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'normal'
  },
  {
    id: 'bed_05',
    name: 'Sarah K.',
    age: 54,
    gender: 'Female',
    admissionDate: '2024-01-14T11:30:00Z',
    duration: '48h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'warning'
  },
  {
    id: 'bed_06',
    name: 'Anna T.',
    age: 42,
    gender: 'Female',
    admissionDate: '2024-01-15T07:00:00Z',
    duration: '24h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'critical'
  },
  {
    id: 'bed_07',
    name: 'Elena R.',
    age: 29,
    gender: 'Female',
    admissionDate: '2024-01-15T13:20:00Z',
    duration: '12h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'normal'
  },
  {
    id: 'bed_08',
    name: 'James P.',
    age: 66,
    gender: 'Male',
    admissionDate: '2024-01-15T19:45:00Z',
    duration: '6h',
    backgroundImage: "https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true",
    riskLevel: 'normal'
  }
];

// Generate realistic vital signs based on risk level
export const generateVitalsForRiskLevel = (riskLevel: 'normal' | 'warning' | 'critical'): VitalReading => {
  const baseVitals = {
    hr: 75,
    bps: 120,
    bpd: 80,
    rr: 16,
    temp: 98.6,
    spo2: 98
  };

  switch (riskLevel) {
    case 'normal':
      return {
        hr: 70 + Math.floor(Math.random() * 20), // 70-89
        bps: 110 + Math.floor(Math.random() * 20), // 110-129
        bpd: 70 + Math.floor(Math.random() * 15), // 70-84
        rr: 12 + Math.floor(Math.random() * 8), // 12-19
        temp: 97.5 + Math.random() * 2, // 97.5-99.5
        spo2: 95 + Math.floor(Math.random() * 5) // 95-99
      };
    
    case 'warning':
      return {
        hr: Math.random() > 0.5 ? 60 + Math.floor(Math.random() * 10) : 100 + Math.floor(Math.random() * 10), // 60-69 or 100-109
        bps: 130 + Math.floor(Math.random() * 10), // 130-139
        bpd: 85 + Math.floor(Math.random() * 10), // 85-94
        rr: 20 + Math.floor(Math.random() * 4), // 20-23
        temp: 99.5 + Math.random() * 1.5, // 99.5-101.0
        spo2: 90 + Math.floor(Math.random() * 5) // 90-94
      };
    
    case 'critical':
      const criticalType = Math.floor(Math.random() * 3);
      switch (criticalType) {
        case 0: // Shock/hypotension
          return {
            hr: 120 + Math.floor(Math.random() * 20), // 120-139
            bps: 70 + Math.floor(Math.random() * 20), // 70-89 (hypotensive)
            bpd: 40 + Math.floor(Math.random() * 15), // 40-54
            rr: 24 + Math.floor(Math.random() * 8), // 24-31
            temp: 101 + Math.random() * 3, // 101-104
            spo2: 85 + Math.floor(Math.random() * 5) // 85-89
          };
        case 1: // Bradycardia/hypoxia
          return {
            hr: 45 + Math.floor(Math.random() * 10), // 45-54 (bradycardic)
            bps: 85 + Math.floor(Math.random() * 15), // 85-99
            bpd: 55 + Math.floor(Math.random() * 10), // 55-64
            rr: 8 + Math.floor(Math.random() * 4), // 8-11 (bradypneic)
            temp: 96 + Math.random() * 2, // 96-98 (hypothermic)
            spo2: 80 + Math.floor(Math.random() * 5) // 80-84 (severely hypoxic)
          };
        default: // Tachycardia/hypertension
          return {
            hr: 140 + Math.floor(Math.random() * 20), // 140-159
            bps: 180 + Math.floor(Math.random() * 20), // 180-199
            bpd: 110 + Math.floor(Math.random() * 15), // 110-124
            rr: 32 + Math.floor(Math.random() * 8), // 32-39
            temp: 104 + Math.random() * 2, // 104-106
            spo2: 88 + Math.floor(Math.random() * 7) // 88-94
          };
      }
  }
};

// Generate historical vitals data for charts
export const generateHistoricalVitals = (bedId: string, hours: number = 24): Array<VitalReading & { timestamp: string }> => {
  const patient = testPatients.find(p => p.id === bedId);
  if (!patient) return [];

  const vitals = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const baseVitals = generateVitalsForRiskLevel(patient.riskLevel);
    
    // Add some realistic variation over time
    const variation = Math.sin(i * 0.1) * 0.1 + (Math.random() - 0.5) * 0.2;
    
    vitals.push({
      ...baseVitals,
      timestamp: timestamp.toISOString(),
      hr: Math.max(40, Math.min(180, Math.round(baseVitals.hr * (1 + variation)))),
      bps: Math.max(60, Math.min(220, Math.round(baseVitals.bps * (1 + variation * 0.5)))),
      bpd: Math.max(40, Math.min(120, Math.round(baseVitals.bpd * (1 + variation * 0.5)))),
      rr: Math.max(8, Math.min(40, Math.round(baseVitals.rr * (1 + variation * 0.3)))),
      temp: Math.max(95, Math.min(108, parseFloat((baseVitals.temp * (1 + variation * 0.02)).toFixed(1)))),
      spo2: Math.max(70, Math.min(100, Math.round(baseVitals.spo2 * (1 + variation * 0.1))))
    });
  }
  
  return vitals;
};

// Current vital signs for all patients
export const generateCurrentVitals = () => {
  const vitalsData = {
    readings: testPatients.map(patient => {
      const vitals = generateVitalsForRiskLevel(patient.riskLevel);
      return {
        bedId: patient.id,
        timestamp: new Date().toISOString(),
        ...vitals
      };
    })
  };
  
  return vitalsData;
};

// Export formatted data for public/vitals.json
export const getVitalsJsonData = () => {
  return JSON.stringify(generateCurrentVitals(), null, 2);
};

// Utility function to get patient by ID
export const getPatientById = (bedId: string): PatientInfo | undefined => {
  return testPatients.find(patient => patient.id === bedId);
};

// Utility function to get patients by risk level
export const getPatientsByRiskLevel = (riskLevel: 'normal' | 'warning' | 'critical'): PatientInfo[] => {
  return testPatients.filter(patient => patient.riskLevel === riskLevel);
};