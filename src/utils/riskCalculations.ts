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

export const calculateRiskScores = (vitals: VitalReading): RiskScore => {
  return {
    shockIndex: calculateShockIndex(vitals.hr, vitals.bps),
    pewsScore: calculatePEWSScore(vitals)
  };
};