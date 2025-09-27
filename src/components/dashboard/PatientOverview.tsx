import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVitals } from '@/hooks/useVitals';
import { calculateRiskScores } from '@/utils/riskCalculations';
import { VitalReading } from '@/services/vitalsService';
import { MiniChart } from './MiniChart';
import { Header } from './Header';

// Mock patient data - carefully crafted to have specific risk levels with minimal critical risk scores
const generateSpecificVitals = (riskLevel: 'normal' | 'warning' | 'critical', avoidCriticalRiskScores: boolean = false): VitalReading => {
  switch (riskLevel) {
    case 'normal':
      return {
        hr: 75 + Math.floor(Math.random() * 15), // 75-90 (normal range 70-100)
        bps: 110 + Math.floor(Math.random() * 20), // 110-130 (normal range 90-140)
        bpd: 75 + Math.floor(Math.random() * 10), // 75-85 (normal range)
        rr: 14 + Math.floor(Math.random() * 4), // 14-18 (normal range 12-20)
        temp: 98.0 + Math.random() * 1.5, // 98.0-99.5°F (normal range 97-100)
        spo2: 97 + Math.floor(Math.random() * 3) // 97-99% (normal range >95)
      };
    case 'warning':
      return {
        hr: Math.random() > 0.5 ? 65 + Math.floor(Math.random() * 5) : 101 + Math.floor(Math.random() * 9), // 65-70 or 101-109 (avoid >110 to prevent critical)
        bps: 125 + Math.floor(Math.random() * 10), // Keep BP in safe warning range
        bpd: 75 + Math.floor(Math.random() * 10), // Normal range for diastolic
        rr: 15 + Math.floor(Math.random() * 4), // Keep RR normal
        temp: 98.0 + Math.random() * 1.5, // Keep temp normal
        spo2: 94 + Math.floor(Math.random() * 2) // 94-95% (warning range, avoid <94 which triggers critical)
      };
    case 'critical':
      if (avoidCriticalRiskScores) {
        // Create patients with some concerning values but not enough to trigger critical risk scores
        return {
          hr: 62 + Math.floor(Math.random() * 6), // 62-67 (slightly low but not critical)
          bps: 85 + Math.floor(Math.random() * 10), // 85-95 (low-normal, won't trigger severe risk scores)
          bpd: 70 + Math.floor(Math.random() * 10),
          rr: 13 + Math.floor(Math.random() * 4), // 13-16 (normal range)
          temp: 96.8 + Math.random() * 1.0, // 96.8-97.8 (slightly low but not critical)
          spo2: 91 + Math.floor(Math.random() * 3) // 91-93% (concerning but less likely to trigger multiple risk scores)
        };
      } else {
        // Create targeted critical conditions - only one parameter critical
        const baseVitals = {
          hr: 75 + Math.floor(Math.random() * 10), // Normal
          bps: 115 + Math.floor(Math.random() * 15), // Normal
          bpd: 75 + Math.floor(Math.random() * 10), // Normal
          rr: 14 + Math.floor(Math.random() * 4), // Normal
          temp: 98.0 + Math.random() * 1.5, // Normal
          spo2: 96 + Math.floor(Math.random() * 3) // Normal
        };
        
        // Only modify 1 parameter to be critical
        const criticalType = Math.floor(Math.random() * 2);
        switch (criticalType) {
          case 0: // Heart rate critical but not extreme
            baseVitals.hr = Math.random() > 0.5 ? 52 + Math.floor(Math.random() * 6) : 122 + Math.floor(Math.random() * 8);
            break;
          case 1: // Oxygen critical
            baseVitals.spo2 = 86 + Math.floor(Math.random() * 3); // 86-88%
            break;
        }
        
        return baseVitals;
      }
  }
};

// Generate time series data for mini charts (last 12 hours)
const generateTimeSeriesData = (baseValue: number, variation: number) => {
  const data = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const value = baseValue + (Math.random() - 0.5) * variation;
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(value * 10) / 10 // Round to 1 decimal place
    });
  }
  return data;
};

const generateAllVitalData = (vitals: VitalReading) => ({
  hr: generateTimeSeriesData(vitals.hr, 20),
  bps: generateTimeSeriesData(vitals.bps, 30),
  bpd: generateTimeSeriesData(vitals.bpd, 20),
  spo2: generateTimeSeriesData(vitals.spo2, 5),
  temp: generateTimeSeriesData(vitals.temp, 2),
  rr: generateTimeSeriesData(vitals.rr, 8)
});

const mockPatients = [
  // Normal patients (3)
  { id: 'bed_01', name: 'Simon A.', age: 45, gender: 'Male', vitals: generateSpecificVitals('normal') },
  { id: 'bed_03', name: 'Maria C.', age: 62, gender: 'Female', vitals: generateSpecificVitals('normal') },
  { id: 'bed_07', name: 'David L.', age: 38, gender: 'Male', vitals: generateSpecificVitals('normal') },
  
  // Warning patients (3)
  { id: 'bed_12', name: 'Sarah K.', age: 54, gender: 'Female', vitals: generateSpecificVitals('warning') },
  { id: 'bed_15', name: 'Robert M.', age: 71, gender: 'Male', vitals: generateSpecificVitals('warning') },
  { id: 'bed_18', name: 'Elena R.', age: 29, gender: 'Female', vitals: generateSpecificVitals('warning') },
  
  // Critical patients (2) - one with critical risk scores, one without
  { id: 'bed_22', name: 'James P.', age: 66, gender: 'Male', vitals: generateSpecificVitals('critical', false) },
  { id: 'bed_25', name: 'Anna T.', age: 42, gender: 'Female', vitals: generateSpecificVitals('critical', true) }
].map(patient => ({
  ...patient,
  chartData: generateAllVitalData(patient.vitals)
}));

export const PatientOverview: React.FC = () => {
  const { loading } = useVitals('bed_15');
  const navigate = useNavigate();
  const [selectedVitals, setSelectedVitals] = useState<Record<string, string>>({});
  
  // Initialize selected vitals to 'hr' for all patients
  React.useEffect(() => {
    const initialSelection: Record<string, string> = {};
    mockPatients.forEach(patient => {
      initialSelection[patient.id] = 'hr';
    });
    setSelectedVitals(initialSelection);
  }, []);
  
  const vitalOptions = [
    { key: 'hr', label: 'HR', unit: 'bpm', color: '#3b82f6' },
    { key: 'bps', label: 'SYS', unit: 'mmHg', color: '#ef4444' },
    { key: 'bpd', label: 'DIA', unit: 'mmHg', color: '#f59e0b' },
    { key: 'spo2', label: 'SpO2', unit: '%', color: '#10b981' },
    { key: 'temp', label: 'Temp', unit: '°F', color: '#8b5cf6' },
    { key: 'rr', label: 'RR', unit: 'bpm', color: '#06b6d4' }
  ];
  
  const getVitalValue = (vitals: VitalReading, key: string): number => {
    switch (key) {
      case 'hr': return vitals.hr;
      case 'bps': return vitals.bps;
      case 'bpd': return vitals.bpd;
      case 'spo2': return vitals.spo2;
      case 'temp': return Number(vitals.temp.toFixed(1));
      case 'rr': return vitals.rr;
      default: return 0;
    }
  };

  // Function to get individual vital risk level
  const getVitalRisk = (vitals: VitalReading, vital: string): 'normal' | 'warning' | 'critical' => {
    switch (vital) {
      case 'hr':
        if (vitals.hr < 60 || vitals.hr > 120) return 'critical';
        if (vitals.hr < 70 || vitals.hr > 100) return 'warning';
        return 'normal';
      case 'bp':
        if (vitals.bps < 80 || vitals.bps > 160) return 'critical';
        if (vitals.bps < 90 || vitals.bps > 140) return 'warning';
        return 'normal';
      case 'spo2':
        if (vitals.spo2 < 90) return 'critical';
        if (vitals.spo2 < 95) return 'warning';
        return 'normal';
      case 'temp':
        if (vitals.temp < 96.0 || vitals.temp > 101.0) return 'critical';
        if (vitals.temp < 97.0 || vitals.temp > 100.0) return 'warning';
        return 'normal';
      case 'rr':
        if (vitals.rr < 10 || vitals.rr > 25) return 'critical';
        if (vitals.rr < 12 || vitals.rr > 20) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  // Function to get critical risk scores for display
  const getCriticalRiskScores = (vitals: VitalReading): Array<{name: string, value: string, description: string}> => {
    const riskScores = calculateRiskScores(vitals);
    const critical: Array<{name: string, value: string, description: string}> = [];
    
    Object.entries(riskScores).forEach(([key, score]) => {
      if (score.risk === 'critical') {
        let displayName = '';
        switch (key) {
          case 'shockIndex': displayName = 'Shock Index'; break;
          case 'pewsScore': displayName = 'PEWS Score'; break;
          case 'map': displayName = 'MAP'; break;
          case 'roxIndex': displayName = 'ROX Index'; break;
          case 'qsofa': displayName = 'qSOFA'; break;
          case 'pulsePressure': displayName = 'Pulse Pressure'; break;
        }
        critical.push({
          name: displayName,
          value: score.value.toString(),
          description: score.description
        });
      }
    });
    
    return critical;
  };
  
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-black">
        <Header />
        <div className="p-8">
          <div className="text-white text-xl font-medium">Loading patient overview...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-black">
      <Header />
      <div className="pt-6 px-6 mt-8 space-y-6">
        {/* Patient Grid with Dark Background Card */}
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-3xl pt-6 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {mockPatients.map(patient => {
            const riskScores = calculateRiskScores(patient.vitals);
            const selectedVital = selectedVitals[patient.id] || 'hr';
            const vitalOption = vitalOptions.find(opt => opt.key === selectedVital) || vitalOptions[0];
            const criticalRiskScores = getCriticalRiskScores(patient.vitals);
            
            // Count individual patient risks for overall status
            const patientRiskCounts = Object.values(riskScores).reduce((acc, score) => {
              acc[score.risk] = (acc[score.risk] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const criticalCount = patientRiskCounts.critical || 0;
            const warningCount = patientRiskCounts.warning || 0;
            
            // Determine overall patient status
            const overallStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'normal';
            
            // Calculate mean blood pressure
            const meanBP = Math.round((patient.vitals.bps + patient.vitals.bpd) / 2);
            
            // Get current vital data and latest value
            const currentChartData = patient.chartData[selectedVital as keyof typeof patient.chartData];
            const latestValue = currentChartData[currentChartData.length - 1]?.value || getVitalValue(patient.vitals, selectedVital);
            
            return (
              <div 
                key={patient.id} 
                className={`
                  bg-black rounded-3xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer
                  ${overallStatus === 'critical' 
                    ? 'border-4 border-red-500' 
                    : overallStatus === 'warning'
                    ? 'border-4 border-yellow-500'
                    : 'border-4 border-transparent'
                  }
                `}
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                  {/* Patient Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-white text-xl font-bold">{patient.name}</div>
                      <div className="text-[rgba(217,217,217,1)] text-base">
                        {patient.id.replace('bed_', 'Bed ')} • {patient.age}y {patient.gender}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full ${
                      overallStatus === 'critical' ? 'bg-red-500' :
                      overallStatus === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                  </div>
                  
                  {/* Vital Sign Selection */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {vitalOptions.map(option => (
                        <button
                          key={option.key}
                          onClick={() => setSelectedVitals(prev => ({ ...prev, [patient.id]: option.key }))}
                          className={`px-3 py-1 rounded-lg text-xs transition-all duration-200 ${
                            selectedVital === option.key
                              ? 'bg-blue-600 text-white'
                              : 'bg-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(100,106,113,1)]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mini Chart with Latest Value */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[rgba(217,217,217,1)] text-sm">{vitalOption.label} - Last 12h</div>
                      <div className="text-right">
                        <span className="text-white font-bold text-lg">{latestValue}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">{vitalOption.unit}</span>
                      </div>
                    </div>
                    <MiniChart 
                      data={currentChartData} 
                      color={vitalOption.color}
                      selectedVital={selectedVital}
                    />
                  </div>
                  
                  {/* Vital Signs - Enhanced Display */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Heart Rate</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(patient.vitals, 'hr') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(patient.vitals, 'hr') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(patient.vitals, 'hr') === 'critical' ? 'text-red-400' :
                          getVitalRisk(patient.vitals, 'hr') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{patient.vitals.hr}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">bpm</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Blood Pressure</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(patient.vitals, 'bp') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(patient.vitals, 'bp') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(patient.vitals, 'bp') === 'critical' ? 'text-red-400' :
                          getVitalRisk(patient.vitals, 'bp') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{patient.vitals.bps}/{patient.vitals.bpd}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">mmHg</span>
                        <div className="text-[rgba(128,128,128,1)] text-xs">Mean: {meanBP} mmHg</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">SpO2</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(patient.vitals, 'spo2') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(patient.vitals, 'spo2') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(patient.vitals, 'spo2') === 'critical' ? 'text-red-400' :
                          getVitalRisk(patient.vitals, 'spo2') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{patient.vitals.spo2}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Temperature</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(patient.vitals, 'temp') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(patient.vitals, 'temp') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(patient.vitals, 'temp') === 'critical' ? 'text-red-400' :
                          getVitalRisk(patient.vitals, 'temp') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{patient.vitals.temp.toFixed(1)}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">°F</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Respiratory Rate</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(patient.vitals, 'rr') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(patient.vitals, 'rr') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(patient.vitals, 'rr') === 'critical' ? 'text-red-400' :
                          getVitalRisk(patient.vitals, 'rr') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{patient.vitals.rr}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">bpm</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Summary - Show critical risk scores for critical patients, otherwise show vital signs */}
                  {overallStatus === 'critical' && criticalRiskScores.length > 0 ? (
                    <div className="mt-6 pt-6 border-t border-[rgba(64,66,73,1)]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-red-400 font-bold text-base">Critical Risk Scores:</span>
                        </div>
                        {criticalRiskScores.map((item, index) => (
                          <div key={index} className="ml-6 text-sm">
                            <div className="text-red-300 font-semibold">{item.name}: {item.value}</div>
                            <div className="text-[rgba(217,217,217,1)] text-xs">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};