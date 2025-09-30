import { VitalReading } from '@/types/vitals';

export interface VitalChange {
  absoluteChange: number;
  relativeChange: number;
  trendIndicator: 'double-up' | 'single-up' | 'neutral' | 'single-down' | 'double-down';
}

// Calculate standard deviation for a set of values
export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
};

// Calculate relative change and trend indicator for a vital sign
export const calculateVitalChange = (
  currentValue: number,
  historicalValues: number[],
  thresholdMultiplier: number = 2
): VitalChange => {
  if (historicalValues.length === 0) {
    return {
      absoluteChange: 0,
      relativeChange: 0,
      trendIndicator: 'neutral'
    };
  }

  // Get value from 1 hour ago (assuming values are in chronological order)
  const oneHourAgoIndex = Math.max(0, historicalValues.length - 120); // 120 readings = 1 hour (30s intervals)
  const oneHourAgoValue = historicalValues[oneHourAgoIndex];
  
  const absoluteChange = currentValue - oneHourAgoValue;
  const relativeChange = oneHourAgoValue !== 0 ? (absoluteChange / oneHourAgoValue) * 100 : 0;
  
  // Calculate standard deviation for trend analysis
  const stdDev = calculateStandardDeviation(historicalValues);
  const singleThreshold = stdDev * 1.0; // Lower threshold for single arrows
  const doubleThreshold = stdDev * 2.0; // Higher threshold for double arrows
  
  let trendIndicator: 'double-up' | 'single-up' | 'neutral' | 'single-down' | 'double-down';
  
  if (Math.abs(absoluteChange) < stdDev * 0.3) {
    trendIndicator = 'neutral';
  } else if (absoluteChange > doubleThreshold) {
    trendIndicator = 'double-up';
  } else if (absoluteChange > singleThreshold) {
    trendIndicator = 'single-up';
  } else if (absoluteChange < -doubleThreshold) {
    trendIndicator = 'double-down';
  } else if (absoluteChange < -singleThreshold) {
    trendIndicator = 'single-down';
  } else {
    trendIndicator = 'neutral';
  }
  
  return {
    absoluteChange,
    relativeChange,
    trendIndicator
  };
};

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
    description = 'SI ≤0.7';
  } else if (value <= 0.9) {
    risk = 'warning';
    description = 'SI 0.7-0.9';
  } else {
    risk = 'critical';
    description = 'SI >0.9';
  }
  
  return { value, risk, description };
};

export const calculatePEWSScore = (vitals: VitalReading): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  let score = 0;
  
  // Heart Rate scoring - more realistic ranges
  if (vitals.hr < 60 || vitals.hr > 120) {
    if (vitals.hr < 50 || vitals.hr > 140) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  // Blood Pressure scoring (using systolic) - more realistic ranges
  if (vitals.bps < 80 || vitals.bps > 160) {
    if (vitals.bps < 70 || vitals.bps > 180) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  // Respiratory Rate scoring - more realistic ranges
  if (vitals.rr < 10 || vitals.rr > 25) {
    if (vitals.rr < 8 || vitals.rr > 30) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  // SpO2 scoring - more realistic ranges
  if (vitals.spo2 < 90) {
    if (vitals.spo2 < 85) {
      score += 2; // Severely low
    } else {
      score += 1; // Moderately low
    }
  }
  
  // Temperature scoring (Fahrenheit) - more realistic ranges
  if (vitals.temp < 96.0 || vitals.temp > 101.0) {
    if (vitals.temp < 95.0 || vitals.temp > 102.0) {
      score += 2; // Severely abnormal
    } else {
      score += 1; // Moderately abnormal
    }
  }
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (score === 0) {
    risk = 'normal';
    description = 'Score: 0';
  } else if (score <= 2) {
    risk = 'warning';
    description = 'Score: 1-2';
  } else {
    risk = 'critical';
    description = 'Score: >2';
  }
  
  return { value: score, risk, description };
};

export const calculateMAP = (systolicBP: number, diastolicBP: number): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  const value = Math.round((systolicBP + 2 * diastolicBP) / 3);
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (value >= 65) {
    risk = 'normal';
    description = 'MAP ≥65';
  } else if (value >= 55) {
    risk = 'warning';
    description = 'MAP 55-65';
  } else {
    risk = 'critical';
    description = 'MAP <55';
  }
  
  return { value, risk, description };
};

export const calculateROXIndex = (spo2: number, rr: number, fio2: number = 21): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  const value = Math.round((spo2 / fio2) / rr * 100) / 100;
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (value >= 4.0) {
    risk = 'normal';
    description = 'ROX ≥4.0';
  } else if (value >= 3.0) {
    risk = 'warning';
    description = 'ROX 3.0-4.0';
  } else {
    risk = 'critical';
    description = 'ROX <3.0';
  }
  
  return { value, risk, description };
};

export const calculateqSOFA = (vitals: VitalReading): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  let score = 0;
  
  // Respiratory rate >= 22
  if (vitals.rr >= 22) score += 1;
  
  // Altered mental status (simplified - using SpO2 as proxy)
  if (vitals.spo2 < 85) score += 1;
  
  // Systolic blood pressure <= 100
  if (vitals.bps <= 90) score += 1;
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (score === 0) {
    risk = 'normal';
    description = 'qSOFA: 0';
  } else if (score === 1) {
    risk = 'warning';
    description = 'qSOFA: 1';
  } else {
    risk = 'critical';
    description = 'qSOFA: ≥2';
  }
  
  return { value: score, risk, description };
};

export const calculatePulsePressure = (systolicBP: number, diastolicBP: number): { value: number; risk: 'normal' | 'warning' | 'critical'; description: string } => {
  const value = systolicBP - diastolicBP;
  
  let risk: 'normal' | 'warning' | 'critical';
  let description: string;
  
  if (value >= 30 && value <= 70) {
    risk = 'normal';
    description = 'PP: 30-70';
  } else if (value >= 20 && value < 30) {
    risk = 'warning';
    description = 'PP: 20-30';
  } else if (value > 70) {
    risk = 'warning';
    description = 'PP: >70';
  } else {
    risk = 'critical';
    description = 'PP: <20';
  }
  
  return { value, risk, description };
};

export const calculateRiskScores = (vitals: VitalReading): RiskScore => {
  return {
    shockIndex: calculateShockIndex(vitals.hr, vitals.bps),
    pewsScore: calculatePEWSScore(vitals),
    map: calculateMAP(vitals.bps, vitals.bpd),
    roxIndex: { value: 0, risk: 'normal', description: 'N/A' },
    qsofa: calculateqSOFA(vitals),
    pulsePressure: calculatePulsePressure(vitals.bps, vitals.bpd)
  };
};