import React from 'react';
import { useVitals } from '@/hooks/useVitals';
import { calculateRiskScores } from '@/utils/riskCalculations';
import { VitalReading } from '@/services/vitalsService';

// Mock patient data - in production this would come from a service
const generateMockVitals = (baseHr: number, baseBps: number, baseBpd: number): VitalReading => ({
  hr: baseHr + Math.floor(Math.random() * 20 - 10),
  bps: baseBps + Math.floor(Math.random() * 30 - 15),
  bpd: baseBpd + Math.floor(Math.random() * 20 - 10),
  rr: 16 + Math.floor(Math.random() * 8 - 4),
  temp: 98.6 + Math.random() * 2 - 1,
  spo2: 95 + Math.floor(Math.random() * 5)
});

const mockPatients = [
  { id: 'bed_01', name: 'Simon A.', age: 45, gender: 'Male', vitals: generateMockVitals(75, 120, 80) },
  { id: 'bed_03', name: 'Maria C.', age: 62, gender: 'Female', vitals: generateMockVitals(82, 135, 85) },
  { id: 'bed_07', name: 'David L.', age: 38, gender: 'Male', vitals: generateMockVitals(68, 110, 75) },
  { id: 'bed_12', name: 'Sarah K.', age: 54, gender: 'Female', vitals: generateMockVitals(88, 145, 90) },
  { id: 'bed_15', name: 'Robert M.', age: 71, gender: 'Male', vitals: generateMockVitals(72, 125, 82) },
  { id: 'bed_18', name: 'Elena R.', age: 29, gender: 'Female', vitals: generateMockVitals(95, 115, 78) },
  { id: 'bed_22', name: 'James P.', age: 66, gender: 'Male', vitals: generateMockVitals(78, 140, 88) },
  { id: 'bed_25', name: 'Anna T.', age: 42, gender: 'Female', vitals: generateMockVitals(85, 130, 85) }
];

export const PatientOverview: React.FC = () => {
  const { loading } = useVitals('bed_15');
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-white text-xl font-medium">Loading patient overview...</div>
      </div>
    );
  }
  
  // Calculate overall statistics
  const totalPatients = mockPatients.length;
  let totalCritical = 0;
  let totalWarning = 0;
  let totalNormal = 0;
  
  mockPatients.forEach(patient => {
    const riskScores = calculateRiskScores(patient.vitals);
    Object.values(riskScores).forEach(score => {
      if (score.risk === 'critical') totalCritical++;
      else if (score.risk === 'warning') totalWarning++;
      else totalNormal++;
    });
  });
  
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-3xl font-bold">Patient Overview Dashboard</h1>
        <div className="text-[rgba(217,217,217,1)] text-base">
          {totalPatients} Patients • Real-time monitoring
        </div>
      </div>
      
      {/* Overall Risk Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {totalPatients}
            </div>
            <div className="text-white text-lg font-medium mb-1">Total Patients</div>
            <div className="text-[rgba(217,217,217,1)] text-sm">Currently monitored</div>
          </div>
        </div>
        
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-[rgba(252,26,26,1)] mb-2">
              {totalCritical}
            </div>
            <div className="text-white text-lg font-medium mb-1">Critical</div>
            <div className="text-[rgba(217,217,217,1)] text-sm">Risk factors requiring immediate attention</div>
          </div>
        </div>
        
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-[rgba(255,193,7,1)] mb-2">
              {totalWarning}
            </div>
            <div className="text-white text-lg font-medium mb-1">Warning</div>
            <div className="text-[rgba(217,217,217,1)] text-sm">Factors requiring monitoring</div>
          </div>
        </div>
        
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-[rgba(17,236,121,1)] mb-2">
              {totalNormal}
            </div>
            <div className="text-white text-lg font-medium mb-1">Normal</div>
            <div className="text-[rgba(217,217,217,1)] text-sm">Parameters within normal range</div>
          </div>
        </div>
      </div>
      
      {/* Patient Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {mockPatients.map(patient => {
          const riskScores = calculateRiskScores(patient.vitals);
          
          // Count individual patient risks
          const patientRiskCounts = Object.values(riskScores).reduce((acc, score) => {
            acc[score.risk] = (acc[score.risk] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const criticalCount = patientRiskCounts.critical || 0;
          const warningCount = patientRiskCounts.warning || 0;
          
          // Determine overall patient status
          const overallStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'normal';
          
          return (
            <div key={patient.id} className={`bg-black border rounded-3xl p-6 ${
              overallStatus === 'critical' ? 'border-[rgba(252,26,26,0.5)] bg-[rgba(252,26,26,0.05)]' :
              overallStatus === 'warning' ? 'border-[rgba(255,193,7,0.5)] bg-[rgba(255,193,7,0.05)]' :
              'border-[rgba(64,66,73,1)]'
            }`}>
              {/* Patient Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white text-lg font-bold">{patient.name}</div>
                  <div className="text-[rgba(217,217,217,1)] text-sm">
                    {patient.id.replace('bed_', 'Bed ')} • {patient.age}y {patient.gender}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full ${
                  overallStatus === 'critical' ? 'bg-red-500' :
                  overallStatus === 'warning' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
              </div>
              
              {/* Vital Signs - Compact Display */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-sm">HR</span>
                  <span className="text-white font-medium">{patient.vitals.hr} bpm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-sm">BP</span>
                  <span className="text-white font-medium">{patient.vitals.bps}/{patient.vitals.bpd}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-sm">SpO2</span>
                  <span className="text-white font-medium">{patient.vitals.spo2}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-sm">Temp</span>
                  <span className="text-white font-medium">{patient.vitals.temp.toFixed(1)}°F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-sm">RR</span>
                  <span className="text-white font-medium">{patient.vitals.rr} bpm</span>
                </div>
              </div>
              
              {/* Risk Summary */}
              <div className="mt-4 pt-4 border-t border-[rgba(64,66,73,1)]">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-400">{criticalCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-400">{warningCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400">{patientRiskCounts.normal || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};