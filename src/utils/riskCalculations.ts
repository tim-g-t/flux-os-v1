import { VitalReading } from '@/services/vitalsService';

export interface RiskScore {
  shockIndex: {
    value: number;
    risk: 'normal' | 'warning' | 'critical';
    description: string;
  };
  pewsScore: {
    value: number;
    risk: 'normal' | 'warning' | 'critical';
    description: string;
  };
  map: {
    value: number;
    risk: 'normal' | 'warning' | 'critical';
    description: string;
  };
  roxIndex: {
    value: number;
    risk: 'normal' | 'warning' | 'critical';
    description: string;
  };
  qsofa: {
    value: number;
    risk: 'normal' | 'warning' | 'critical';
    description: string;
  };
  pulsePressure: {
    value: number;
    risk: 'normal' | 'warning' | 'critical';
    description: string;
  };
}

export const calculateShockIndex = (hr: number, systolicBP: number): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  const value = Math.round((hr / systolicBP) * 100) / 100;
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (value <= 0.7) {
    risk = 'normal';
    description = 'Normal range';
  } else if (value <= 0.9) {
    risk = 'warning';
    description = 'Elevated - monitor closely';
  } else {
    risk = 'critical';
    description = 'Critical - immediate attention needed';
  }
  
  return { value, risk, description };
};

export const calculatePEWSScore = (vitals: VitalReading): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  let score = 0;
  
  // Heart Rate scoring
  if (vitals.hr < 70 || vitals.hr > 100) {
    if (vitals.hr < 60 || vitals.hr > 120) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  // Blood Pressure scoring (using systolic)
  if (vitals.bps < 90 || vitals.bps > 140) {
    if (vitals.bps < 80 || vitals.bps > 160) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  // Respiratory Rate scoring
  if (vitals.rr < 12 || vitals.rr > 20) {
    if (vitals.rr < 10 || vitals.rr > 25) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  // SpO2 scoring
  if (vitals.spo2 < 95) {
    if (vitals.spo2 < 90) {
      score += 2; // Severely low
    } else {
      score += 1; // Moderately low
    }
  }
  
  // Temperature scoring (Fahrenheit)
  if (vitals.temp < 97.0 || vitals.temp > 100.0) {
    if (vitals.temp < 96.0 || vitals.temp > 101.0) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (score === 0) {
    risk = 'normal';
    description = 'All vitals within normal limits';
  } else if (score <= 2) {
    risk = 'warning';
    description = 'Mild deviation from normal - monitor';
  } else {
    risk = 'critical';
    description = 'Significant deviation - urgent review needed';
  }
  
  return { value: score, risk, description };
};

export const calculateMAP = (systolicBP: number, diastolicBP: number): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  const value = Math.round((systolicBP + 2 * diastolicBP) / 3);
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (value >= 70) {
    risk = 'normal';
    description = 'Adequate perfusion';
  } else if (value >= 60) {
    risk = 'warning';
    description = 'Reduced perfusion - monitor';
  } else {
    risk = 'critical';
    description = 'Poor perfusion - urgent intervention';
  }
  
  return { value, risk, description };
};

export const calculateROXIndex = (spo2: number, rr: number, fio2: number = 21): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  const value = Math.round((spo2 / fio2) / rr * 100) / 100;
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (value >= 4.88) {
    risk = 'normal';
    description = 'Low risk of respiratory failure';
  } else if (value >= 3.85) {
    risk = 'warning';
    description = 'Moderate risk - monitor closely';
  } else {
    risk = 'critical';
    description = 'High risk of respiratory failure';
  }
  
  return { value, risk, description };
};

export const calculateqSOFA = (vitals: VitalReading): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  let score = 0;
  
  // Respiratory rate >= 22
  if (vitals.rr >= 22) score += 1;
  
  // Altered mental status (simplified - using SpO2 as proxy)
  if (vitals.spo2 < 90) score += 1;
  
  // Systolic blood pressure <= 100
  if (vitals.bps <= 100) score += 1;
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (score === 0) {
    risk = 'normal';
    description = 'No sepsis risk factors';
  } else if (score === 1) {
    risk = 'warning';
    description = 'Possible sepsis - monitor';
  } else {
    risk = 'critical';
    description = 'High sepsis risk - immediate assessment';
  }
  
  return { value: score, risk, description };
};

export const calculatePulsePressure = (systolicBP: number, diastolicBP: number): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  const value = systolicBP - diastolicBP;
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (value >= 40 && value <= 60) {
    risk = 'normal';
    description = 'Normal volume status';
  } else if (value >= 30 && value < 40) {
    risk = 'warning';
    description = 'Reduced stroke volume - monitor';
  } else if (value > 60) {
    risk = 'warning';
    description = 'Wide pulse pressure - assess';
  } else {
    risk = 'critical';
    description = 'Narrow pulse pressure - hypovolemia risk';
  }
  
  return { value, risk, description };
};

export const calculateRiskScores = (vitals: VitalReading): RiskScore => {
  return {
    shockIndex: calculateShockIndex(vitals.hr, vitals.bps),
    pewsScore: calculatePEWSScore(vitals),
    map: calculateMAP(vitals.bps, vitals.bpd),
    roxIndex: calculateROXIndex(vitals.spo2, vitals.rr),
    qsofa: calculateqSOFA(vitals),
    pulsePressure: calculatePulsePressure(vitals.bps, vitals.bpd)
  };
};