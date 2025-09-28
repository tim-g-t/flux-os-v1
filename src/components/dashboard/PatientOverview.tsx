import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVitals } from '@/hooks/useVitals';
import { calculateRiskScores } from '@/utils/riskCalculations';
import { VitalReading } from '@/services/vitalsService';
import { MiniChart } from './MiniChart';
import { Header } from './Header';
import { testPatients, generateVitalsForRiskLevel, generateHistoricalVitals } from '@/data/testData';

// Clean up - now using centralized test data instead of duplicate functions

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

// Using centralized test data from testData.ts
const mockPatients = testPatients.map(patient => ({
  ...patient,
  vitals: generateVitalsForRiskLevel(patient.riskLevel),
  chartData: generateAllVitalData(generateVitalsForRiskLevel(patient.riskLevel))
}));

interface PatientOverviewProps {
  onPatientSelect?: (patientId: string) => void;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({ onPatientSelect }) => {
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
        if (vitals.hr < 50 || vitals.hr > 140) return 'critical';
        if (vitals.hr < 60 || vitals.hr > 120) return 'warning';
        return 'normal';
      case 'bp':
        if (vitals.bps < 70 || vitals.bps > 180) return 'critical';
        if (vitals.bps < 80 || vitals.bps > 160) return 'warning';
        return 'normal';
      case 'spo2':
        if (vitals.spo2 < 85) return 'critical';
        if (vitals.spo2 < 90) return 'warning';
        return 'normal';
      case 'temp':
        if (vitals.temp < 95.0 || vitals.temp > 102.0) return 'critical';
        if (vitals.temp < 96.0 || vitals.temp > 101.0) return 'warning';
        return 'normal';
      case 'rr':
        if (vitals.rr < 8 || vitals.rr > 30) return 'critical';
        if (vitals.rr < 10 || vitals.rr > 25) return 'warning';
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
      <div className="flex flex-col h-full">
        <Header />
        <div className="p-6">
          <div className="text-white text-xl font-medium">Loading patient overview...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="pt-6 px-6 mt-8 ">
        {/* Patient Grid with Dark Background Card */}
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-3xl pt-6 px-6 pb-8">
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
                    : 'border-0'
                  }
                `}
                onClick={() => {
                  if (onPatientSelect) {
                    onPatientSelect(patient.id);
                  }
                  navigate(`/patient/${patient.id}`);
                }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVitals(prev => ({ ...prev, [patient.id]: option.key }));
                          }}
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