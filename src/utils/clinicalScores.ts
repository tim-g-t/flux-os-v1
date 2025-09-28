import { VitalReading } from '@/services/vitalsService';
import { APIVitalReading } from '@/types/patient';

export interface ClinicalScore {
  value: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// NEWS2 Score - National Early Warning Score 2
// Most widely used clinical deterioration score
export const calculateNEWS2 = (vitals: VitalReading): ClinicalScore => {
  let score = 0;

  // Respiratory Rate scoring
  if (vitals.rr <= 8 || vitals.rr >= 25) {
    score += 3;
  } else if (vitals.rr >= 21 && vitals.rr <= 24) {
    score += 2;
  } else if (vitals.rr >= 9 && vitals.rr <= 11) {
    score += 1;
  }

  // SpO2 scoring (Scale 2 - no supplemental O2)
  if (vitals.spo2 <= 91) {
    score += 3;
  } else if (vitals.spo2 >= 92 && vitals.spo2 <= 93) {
    score += 2;
  } else if (vitals.spo2 >= 94 && vitals.spo2 <= 95) {
    score += 1;
  }

  // Temperature scoring (converted from Fahrenheit)
  const tempC = (vitals.temp - 32) * 5/9;
  if (tempC <= 35.0) {
    score += 3;
  } else if (tempC >= 39.1) {
    score += 2;
  } else if (tempC >= 35.1 && tempC <= 36.0) {
    score += 1;
  } else if (tempC >= 38.1 && tempC <= 39.0) {
    score += 1;
  }

  // Systolic BP scoring
  if (vitals.bps <= 90 || vitals.bps >= 220) {
    score += 3;
  } else if (vitals.bps >= 91 && vitals.bps <= 100) {
    score += 2;
  } else if (vitals.bps >= 101 && vitals.bps <= 110) {
    score += 1;
  }

  // Pulse scoring
  if (vitals.hr <= 40 || vitals.hr >= 131) {
    score += 3;
  } else if (vitals.hr >= 111 && vitals.hr <= 130) {
    score += 2;
  } else if (vitals.hr >= 41 && vitals.hr <= 50) {
    score += 1;
  } else if (vitals.hr >= 91 && vitals.hr <= 110) {
    score += 1;
  }

  // Determine risk level
  let risk: 'low' | 'medium' | 'high' | 'critical';
  let description: string;

  if (score === 0) {
    risk = 'low';
    description = 'Score: 0';
  } else if (score <= 4) {
    risk = 'low';
    description = 'Score: 1-4';
  } else if (score === 5 || score === 6) {
    risk = 'medium';
    description = 'Score: 5-6';
  } else if (score >= 7) {
    risk = 'critical';
    description = 'Score: ≥7';
  } else {
    risk = 'medium';
    description = 'Score: Medium';
  }

  return { value: score, risk, description };
};

// Modified Shock Index (MSI) - Better for ICU patients
export const calculateModifiedShockIndex = (vitals: VitalReading): ClinicalScore => {
  const map = Math.round((vitals.bps + 2 * vitals.bpd) / 3);
  const value = Math.round((vitals.hr / map) * 100) / 100;

  let risk: 'low' | 'medium' | 'high' | 'critical';
  let description: string;

  if (value <= 0.7) {
    risk = 'low';
    description = 'MSI ≤0.7';
  } else if (value <= 1.3) {
    risk = 'medium';
    description = 'MSI 0.7-1.3';
  } else if (value <= 1.7) {
    risk = 'high';
    description = 'MSI 1.3-1.7';
  } else {
    risk = 'critical';
    description = 'MSI >1.7';
  }

  return { value, risk, description };
};

// Respiratory Deterioration Index
export const calculateRespiratoryIndex = (vitals: VitalReading): ClinicalScore => {
  // ROX Index simplified: SpO2/RR
  const roxSimplified = vitals.spo2 / vitals.rr;

  // Respiratory instability score
  let score = 0;

  // Tachypnea scoring
  if (vitals.rr > 30) score += 3;
  else if (vitals.rr > 25) score += 2;
  else if (vitals.rr > 20) score += 1;

  // Hypoxemia scoring
  if (vitals.spo2 < 88) score += 3;
  else if (vitals.spo2 < 92) score += 2;
  else if (vitals.spo2 < 95) score += 1;

  // Compensatory tachycardia
  if (vitals.hr > 120 && vitals.spo2 < 95) score += 2;
  else if (vitals.hr > 100 && vitals.spo2 < 95) score += 1;

  const value = Math.round(roxSimplified * 10) / 10;

  let risk: 'low' | 'medium' | 'high' | 'critical';
  let description: string;

  if (score === 0 && roxSimplified > 10) {
    risk = 'low';
    description = 'Index: Low';
  } else if (score <= 2 && roxSimplified > 5) {
    risk = 'medium';
    description = 'Index: Moderate';
  } else if (score <= 4 || roxSimplified <= 5) {
    risk = 'high';
    description = 'Index: High';
  } else {
    risk = 'critical';
    description = 'Index: Critical';
  }

  return { value: score, risk, description };
};

// Calculate System Instability Score
export const calculateSystemInstability = (
  currentVitals: VitalReading,
  historicalVitals: VitalReading[]
): ClinicalScore => {
  if (historicalVitals.length < 2) {
    return {
      value: 0,
      risk: 'low',
      description: 'Insufficient data'
    };
  }

  // Calculate coefficient of variation for each vital
  const calculateCV = (values: number[]): number => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return mean !== 0 ? (stdDev / mean) * 100 : 0;
  };

  const hrValues = historicalVitals.map(v => v.hr);
  const bpsValues = historicalVitals.map(v => v.bps);
  const rrValues = historicalVitals.map(v => v.rr);
  const spo2Values = historicalVitals.map(v => v.spo2);

  const hrCV = calculateCV(hrValues);
  const bpsCV = calculateCV(bpsValues);
  const rrCV = calculateCV(rrValues);
  const spo2CV = calculateCV(spo2Values);

  // Combined instability score
  const value = Math.round((hrCV + bpsCV + rrCV + spo2CV) / 4);

  let risk: 'low' | 'medium' | 'high' | 'critical';
  let description: string;

  if (value < 5) {
    risk = 'low';
    description = 'CV <5%';
  } else if (value < 10) {
    risk = 'medium';
    description = 'CV 5-10%';
  } else if (value < 15) {
    risk = 'high';
    description = 'CV 10-15%';
  } else {
    risk = 'critical';
    description = 'CV >15%';
  }

  return { value, risk, description };
};

// Time-based risk trajectory
export interface RiskTrajectory {
  timestamp: Date;
  combinedRisk: number;
  trend: 'improving' | 'stable' | 'deteriorating' | 'critical';
}

export const calculateRiskTrajectory = (
  vitalHistory: APIVitalReading[]
): RiskTrajectory[] => {
  if (vitalHistory.length < 2) return [];

  return vitalHistory.map((vital, index) => {
    const vitalReading: VitalReading = {
      hr: vital.Pulse,
      bps: vital.BloodPressure.Systolic,
      bpd: vital.BloodPressure.Diastolic,
      rr: vital.RespirationRate,
      temp: vital.Temp,
      spo2: vital.SpO2
    };

    const news2 = calculateNEWS2(vitalReading);
    const msi = calculateModifiedShockIndex(vitalReading);
    const respiratory = calculateRespiratoryIndex(vitalReading);

    // Weight scores by clinical importance
    const combinedRisk = (news2.value * 3 + msi.value * 10 + respiratory.value * 2) / 3;

    // Determine trend
    let trend: 'improving' | 'stable' | 'deteriorating' | 'critical';
    if (index === 0) {
      trend = 'stable';
    } else {
      const prevVital: VitalReading = {
        hr: vitalHistory[index - 1].Pulse,
        bps: vitalHistory[index - 1].BloodPressure.Systolic,
        bpd: vitalHistory[index - 1].BloodPressure.Diastolic,
        rr: vitalHistory[index - 1].RespirationRate,
        temp: vitalHistory[index - 1].Temp,
        spo2: vitalHistory[index - 1].SpO2
      };

      const prevNews2 = calculateNEWS2(prevVital);
      const prevCombined = (prevNews2.value * 3 + msi.value * 10 + respiratory.value * 2) / 3;

      const change = combinedRisk - prevCombined;

      if (change > 2) trend = 'critical';
      else if (change > 0.5) trend = 'deteriorating';
      else if (change < -0.5) trend = 'improving';
      else trend = 'stable';
    }

    return {
      timestamp: new Date(vital.time),
      combinedRisk: Math.round(combinedRisk * 10) / 10,
      trend
    };
  });
};

// Calculate time to critical event (predictive)
export const estimateTimeToEvent = (
  trajectory: RiskTrajectory[]
): { hours: number; confidence: 'low' | 'medium' | 'high' } | null => {
  if (trajectory.length < 3) return null;

  // Get last 3 readings to calculate acceleration
  const recent = trajectory.slice(-3);
  const riskValues = recent.map(r => r.combinedRisk);

  // Calculate rate of change
  const changeRate = (riskValues[2] - riskValues[0]) / 2;

  // If improving or stable, no event predicted
  if (changeRate <= 0) return null;

  // Critical threshold is combinedRisk > 10
  const currentRisk = riskValues[2];
  const criticalThreshold = 10;

  if (currentRisk >= criticalThreshold) {
    return { hours: 0, confidence: 'high' };
  }

  // Estimate hours to critical based on current rate
  const hoursToEvent = (criticalThreshold - currentRisk) / changeRate;

  // Determine confidence based on trend consistency
  const allDeteriorating = recent.every(r => r.trend === 'deteriorating' || r.trend === 'critical');
  const confidence = allDeteriorating ? 'high' : changeRate > 1 ? 'medium' : 'low';

  return {
    hours: Math.round(hoursToEvent * 10) / 10,
    confidence
  };
};