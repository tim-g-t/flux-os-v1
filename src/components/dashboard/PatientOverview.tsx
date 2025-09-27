import React from 'react';
import { useVitals } from '@/hooks/useVitals';
import { calculateRiskScores } from '@/utils/riskCalculations';

export const PatientOverview: React.FC = () => {
  const { getLatestVitals, loading } = useVitals('bed_15');
  
  const latestVitals = getLatestVitals();
  const riskScores = latestVitals ? calculateRiskScores(latestVitals) : null;
  
  if (loading || !latestVitals || !riskScores) {
    return (
      <div className="p-8">
        <div className="text-white text-xl font-medium">Loading patient overview...</div>
      </div>
    );
  }
  
  // Count risk levels
  const riskCounts = Object.values(riskScores).reduce((acc, score) => {
    acc[score.risk] = (acc[score.risk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const criticalCount = riskCounts.critical || 0;
  const warningCount = riskCounts.warning || 0;
  const normalCount = riskCounts.normal || 0;
  
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-3xl font-bold">Patient Overview</h1>
        <div className="text-[rgba(217,217,217,1)] text-base">
          Bed 15 • Real-time monitoring
        </div>
      </div>
      
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-[rgba(252,26,26,1)] mb-2">
              {criticalCount}
            </div>
            <div className="text-white text-lg font-medium mb-1">Critical</div>
            <div className="text-[rgba(217,217,217,1)] text-sm">Risk factors requiring immediate attention</div>
          </div>
        </div>
        
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-[rgba(255,193,7,1)] mb-2">
              {warningCount}
            </div>
            <div className="text-white text-lg font-medium mb-1">Warning</div>
            <div className="text-[rgba(217,217,217,1)] text-sm">Factors requiring monitoring</div>
          </div>
        </div>
        
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-[rgba(17,236,121,1)] mb-2">
              {normalCount}
            </div>
            <div className="text-white text-lg font-medium mb-1">Normal</div>
            <div className="text-[rgba(217,217,217,1)] text-sm">Parameters within normal range</div>
          </div>
        </div>
      </div>
      
      {/* Current Vitals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Heart Rate */}
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {latestVitals.hr}
              <span className="text-gray-500 text-sm ml-1">bpm</span>
            </div>
            <div className="text-white text-base font-medium mb-1">Heart Rate</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
              riskScores.pewsScore.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
              riskScores.pewsScore.risk === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {riskScores.pewsScore.risk}
            </div>
          </div>
        </div>
        
        {/* Blood Pressure */}
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {latestVitals.bps}/{latestVitals.bpd}
              <span className="text-gray-500 text-sm ml-1">mmHg</span>
            </div>
            <div className="text-white text-base font-medium mb-1">Blood Pressure</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
              riskScores.map.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
              riskScores.map.risk === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {riskScores.map.risk}
            </div>
          </div>
        </div>
        
        {/* SpO2 */}
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {latestVitals.spo2}
              <span className="text-gray-500 text-sm ml-1">%</span>
            </div>
            <div className="text-white text-base font-medium mb-1">SpO2</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
              riskScores.roxIndex.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
              riskScores.roxIndex.risk === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {riskScores.roxIndex.risk}
            </div>
          </div>
        </div>
        
        {/* Temperature */}
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {latestVitals.temp}
              <span className="text-gray-500 text-sm ml-1">°F</span>
            </div>
            <div className="text-white text-base font-medium mb-1">Temperature</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
              riskScores.pewsScore.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
              riskScores.pewsScore.risk === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {riskScores.pewsScore.risk}
            </div>
          </div>
        </div>
        
        {/* Respiratory Rate */}
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {latestVitals.rr}
              <span className="text-gray-500 text-sm ml-1">bpm</span>
            </div>
            <div className="text-white text-base font-medium mb-1">Respiratory Rate</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
              riskScores.qsofa.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
              riskScores.qsofa.risk === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {riskScores.qsofa.risk}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Risk Assessment */}
      <div className="bg-black border border-[rgba(64,66,73,1)] rounded-3xl p-6">
        <h3 className="text-white text-xl font-medium mb-4">Quick Risk Assessment</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex justify-between items-center p-3 bg-[rgba(20,21,25,1)] rounded-2xl">
            <span className="text-white">Shock Index</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{riskScores.shockIndex.value}</span>
              <div className={`w-3 h-3 rounded-full ${
                riskScores.shockIndex.risk === 'critical' ? 'bg-red-500' :
                riskScores.shockIndex.risk === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-[rgba(20,21,25,1)] rounded-2xl">
            <span className="text-white">PEWS Score</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{riskScores.pewsScore.value}</span>
              <div className={`w-3 h-3 rounded-full ${
                riskScores.pewsScore.risk === 'critical' ? 'bg-red-500' :
                riskScores.pewsScore.risk === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-[rgba(20,21,25,1)] rounded-2xl">
            <span className="text-white">MAP</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{riskScores.map.value}</span>
              <div className={`w-3 h-3 rounded-full ${
                riskScores.map.risk === 'critical' ? 'bg-red-500' :
                riskScores.map.risk === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-[rgba(20,21,25,1)] rounded-2xl">
            <span className="text-white">ROX Index</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{riskScores.roxIndex.value}</span>
              <div className={`w-3 h-3 rounded-full ${
                riskScores.roxIndex.risk === 'critical' ? 'bg-red-500' :
                riskScores.roxIndex.risk === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-[rgba(20,21,25,1)] rounded-2xl">
            <span className="text-white">qSOFA</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{riskScores.qsofa.value}</span>
              <div className={`w-3 h-3 rounded-full ${
                riskScores.qsofa.risk === 'critical' ? 'bg-red-500' :
                riskScores.qsofa.risk === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-[rgba(20,21,25,1)] rounded-2xl">
            <span className="text-white">Pulse Pressure</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{riskScores.pulsePressure.value}</span>
              <div className={`w-3 h-3 rounded-full ${
                riskScores.pulsePressure.risk === 'critical' ? 'bg-red-500' :
                riskScores.pulsePressure.risk === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};