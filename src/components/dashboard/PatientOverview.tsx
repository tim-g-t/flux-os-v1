import React, { useState } from 'react';
import { useVitals } from '@/hooks/useVitals';
import { calculateRiskScores } from '@/utils/riskCalculations';
import { VitalReading } from '@/services/vitalsService';
import { MiniChart } from './MiniChart';

// Mock patient data - in production this would come from a service
const generateMockVitals = (baseHr: number, baseBps: number, baseBpd: number): VitalReading => ({
  hr: baseHr + Math.floor(Math.random() * 20 - 10),
  bps: baseBps + Math.floor(Math.random() * 30 - 15),
  bpd: baseBpd + Math.floor(Math.random() * 20 - 10),
  rr: 16 + Math.floor(Math.random() * 8 - 4),
  temp: 98.6 + Math.random() * 2 - 1,
  spo2: 95 + Math.floor(Math.random() * 5)
});

// Generate time series data for mini charts (last 12 hours)
const generateTimeSeriesData = (baseValue: number, variation: number) => {
  const data = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const value = baseValue + (Math.random() - 0.5) * variation;
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(value)
    });
  }
  return data;
};

const mockPatients = [
  { id: 'bed_01', name: 'Simon A.', age: 45, gender: 'Male', vitals: generateMockVitals(75, 120, 80), hrData: generateTimeSeriesData(75, 20) },
  { id: 'bed_03', name: 'Maria C.', age: 62, gender: 'Female', vitals: generateMockVitals(82, 135, 85), hrData: generateTimeSeriesData(82, 15) },
  { id: 'bed_07', name: 'David L.', age: 38, gender: 'Male', vitals: generateMockVitals(68, 110, 75), hrData: generateTimeSeriesData(68, 12) },
  { id: 'bed_12', name: 'Sarah K.', age: 54, gender: 'Female', vitals: generateMockVitals(88, 145, 90), hrData: generateTimeSeriesData(88, 25) },
  { id: 'bed_15', name: 'Robert M.', age: 71, gender: 'Male', vitals: generateMockVitals(72, 125, 82), hrData: generateTimeSeriesData(72, 18) },
  { id: 'bed_18', name: 'Elena R.', age: 29, gender: 'Female', vitals: generateMockVitals(95, 115, 78), hrData: generateTimeSeriesData(95, 30) },
  { id: 'bed_22', name: 'James P.', age: 66, gender: 'Male', vitals: generateMockVitals(78, 140, 88), hrData: generateTimeSeriesData(78, 20) },
  { id: 'bed_25', name: 'Anna T.', age: 42, gender: 'Female', vitals: generateMockVitals(85, 130, 85), hrData: generateTimeSeriesData(85, 22) }
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
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
          
          // Calculate mean blood pressure
          const meanBP = Math.round((patient.vitals.bps + patient.vitals.bpd) / 2);
          
          return (
            <div 
              key={patient.id} 
              className={`
                bg-black rounded-3xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer
                ${overallStatus === 'critical' 
                  ? 'border-4 border-red-500' 
                  : 'border-4 border-[rgba(64,66,73,1)] hover:border-[rgba(100,106,113,1)]'
                }
              `}
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
              
              {/* Mini Chart */}
              <div className="mb-6">
                <div className="text-[rgba(217,217,217,1)] text-sm mb-2">Heart Rate - Last 12h</div>
                <MiniChart 
                  data={patient.hrData} 
                  color={overallStatus === 'critical' ? '#ef4444' : '#3b82f6'} 
                />
              </div>
              
              {/* Vital Signs - Enhanced Display */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-base">Heart Rate</span>
                  <div className="text-right">
                    <span className="text-white font-bold text-lg">{patient.vitals.hr}</span>
                    <span className="text-[rgba(128,128,128,1)] text-sm ml-1">bpm</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-base">Blood Pressure</span>
                  <div className="text-right">
                    <span className="text-white font-bold text-lg">{patient.vitals.bps}/{patient.vitals.bpd}</span>
                    <span className="text-[rgba(128,128,128,1)] text-sm ml-1">mmHg</span>
                    <div className="text-[rgba(128,128,128,1)] text-xs">Mean: {meanBP} mmHg</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-base">SpO2</span>
                  <div className="text-right">
                    <span className="text-white font-bold text-lg">{patient.vitals.spo2}</span>
                    <span className="text-[rgba(128,128,128,1)] text-sm ml-1">%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-base">Temperature</span>
                  <div className="text-right">
                    <span className="text-white font-bold text-lg">{patient.vitals.temp.toFixed(1)}</span>
                    <span className="text-[rgba(128,128,128,1)] text-sm ml-1">°F</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgba(217,217,217,1)] text-base">Respiratory Rate</span>
                  <div className="text-right">
                    <span className="text-white font-bold text-lg">{patient.vitals.rr}</span>
                    <span className="text-[rgba(128,128,128,1)] text-sm ml-1">bpm</span>
                  </div>
                </div>
              </div>
              
              {/* Risk Summary */}
              <div className="mt-6 pt-6 border-t border-[rgba(64,66,73,1)]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-400 font-medium">{criticalCount} Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-400 font-medium">{warningCount} Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-medium">{patientRiskCounts.normal || 0} Normal</span>
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