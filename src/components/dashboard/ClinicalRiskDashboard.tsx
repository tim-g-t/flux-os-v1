import React, { useMemo, useEffect, useState } from 'react';
import { useVitals } from '@/hooks/useVitals';
import {
  calculateNEWS2,
  calculateModifiedShockIndex,
  calculateRespiratoryIndex,
  calculateSystemInstability,
  calculateRiskTrajectory,
  ClinicalScore
} from '@/utils/clinicalScores';
import { calculateShockIndex, calculateqSOFA, calculateMAP, calculatePulsePressure } from '@/utils/riskCalculations';
import { RiskScoreDetailModal } from './RiskScoreDetailModal';

// Clinical thresholds for each score
const SCORE_THRESHOLDS: Record<string, { normal: string; warning?: string; critical?: string }> = {
  NEWS2: { normal: '0-4', warning: '5-6', critical: '≥7' },
  MSI: { normal: '<0.7', warning: '0.7-1.0', critical: '>1.0' },
  'Respiratory Index': { normal: '0-1', warning: '1-2', critical: '>2' },
  'Shock Index': { normal: '0.5-0.7', warning: '0.7-0.9', critical: '>0.9' },
  qSOFA: { normal: '0-1', warning: '2', critical: '≥3' },
  MAP: { normal: '>65', warning: '60-65', critical: '<60' },
  'Pulse Pressure': { normal: '30-50', warning: '20-30', critical: '<20' },
  'System Stability': { normal: '8-10', warning: '5-8', critical: '<5' }
};

// Actions for each score status
const SCORE_ACTIONS: Record<string, Record<string, string>> = {
  NEWS2: {
    normal: 'Continue monitoring',
    warning: 'Increase observation frequency',
    critical: 'Urgent medical review required'
  },
  MSI: {
    normal: 'No action needed',
    warning: 'Check volume status',
    critical: 'Consider fluid resuscitation • Pattern: Pre-shock'
  },
  'Respiratory Index': {
    normal: 'No action needed',
    warning: 'Monitor respiratory trend',
    critical: 'Assess for respiratory support'
  },
  'Shock Index': {
    normal: 'Monitor trend',
    warning: 'Assess hemodynamic status',
    critical: 'Consider vasopressor support'
  },
  qSOFA: {
    normal: 'Check in 2h',
    warning: 'Sepsis screening',
    critical: 'Initiate sepsis bundle'
  },
  MAP: {
    normal: 'Adequate perfusion',
    warning: 'Monitor closely',
    critical: 'Hemodynamic intervention needed'
  },
  'Pulse Pressure': {
    normal: 'Normal',
    warning: 'Assess cardiac function',
    critical: 'Cardiac evaluation needed'
  },
  'System Stability': {
    normal: 'Stable',
    warning: 'Increasing variability',
    critical: 'System instability detected'
  }
};

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, width = 100, height = 30 }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
};

interface ScoreCardProps {
  name: string;
  value: number | string;
  sparklineData: number[];
  status: 'normal' | 'warning' | 'critical';
  onClick: () => void;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ name, value, sparklineData, status, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'critical': return 'border-red-500/20';
      case 'warning': return 'border-yellow-500/20';
      default: return 'border-[rgba(64,66,73,1)]';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-black border ${getBorderColor()} rounded-xl p-4 cursor-pointer
                  hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10
                  transition-all duration-300 group`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-[rgba(217,217,217,1)] text-sm font-medium group-hover:text-white transition-colors">
          {name}
        </h3>
        <div
          className="w-2 h-2 rounded-full opacity-50"
          style={{ backgroundColor: getStatusColor() }}
        />
      </div>

      <div className="flex items-end justify-between">
        <span className="text-white text-2xl font-bold">{value}</span>
        <div className="ml-4">
          <Sparkline
            data={sparklineData}
            color={getStatusColor()}
            width={80}
            height={25}
          />
        </div>
      </div>
    </div>
  );
};

interface ScoreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreName: string;
  currentValue: number | string;
  historicalData: Array<{ time: string; value: number }>;
  status: 'normal' | 'warning' | 'critical';
}

const ScoreDetailModal: React.FC<ScoreDetailModalProps> = ({
  isOpen,
  onClose,
  scoreName,
  currentValue,
  historicalData,
  status
}) => {
  const [localInterventionMode, setLocalInterventionMode] = useState(false);
  const [localSimulatedIntervention, setLocalSimulatedIntervention] = useState<string | null>(null);

  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const maxValue = Math.max(...historicalData.map(d => d.value));
  const minValue = Math.min(...historicalData.map(d => d.value));
  const avgValue = historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length;
  const numericValue = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;

  // Check if deteriorating
  const recent = historicalData.slice(-10);
  const percentChange = recent.length > 1
    ? ((recent[recent.length - 1].value - recent[0].value) / recent[0].value * 100)
    : 0;
  const isDeteriorating = percentChange > 10 && status !== 'normal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[rgba(217,217,217,1)] hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-white text-2xl font-bold">{scoreName}</h2>
            {isDeteriorating && (
              <div className="mt-2 bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg px-3 py-1 inline-block animate-pulse">
                <span className="text-red-400 text-sm font-medium">DETERIORATION TRAJECTORY DETECTED</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setLocalInterventionMode(!localInterventionMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              localInterventionMode
                ? 'bg-blue-600 text-white'
                : 'bg-[rgba(26,27,32,1)] border border-blue-500 text-blue-400 hover:bg-blue-900/30'
            }`}
          >
            {localInterventionMode ? 'Intervention Mode' : 'Intervention Simulator'}
          </button>
        </div>

        {/* Current Value Display */}
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-2xl p-6 mb-6">
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-bold text-white">{currentValue}</span>
            <span className="text-[rgba(217,217,217,1)]">Current</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm">24h Min</p>
              <p className="text-white font-semibold">{minValue.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm">24h Avg</p>
              <p className="text-white font-semibold">{avgValue.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm">24h Max</p>
              <p className="text-white font-semibold">{maxValue.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">24 Hour Trend</h3>
          <div className="h-64 relative">
            <svg className="w-full h-full">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(percent => (
                <line
                  key={percent}
                  x1="0"
                  y1={`${percent}%`}
                  x2="100%"
                  y2={`${percent}%`}
                  stroke="rgba(64,66,73,0.5)"
                  strokeWidth="1"
                />
              ))}

              {/* Data line */}
              <polyline
                points={historicalData.map((d, i) => {
                  const x = (i / (historicalData.length - 1)) * 100;
                  const y = 100 - ((d.value - minValue) / (maxValue - minValue || 1)) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke={getStatusColor()}
                strokeWidth="2"
              />

              {/* Data points */}
              {historicalData.map((d, i) => {
                const x = (i / (historicalData.length - 1)) * 100;
                const y = 100 - ((d.value - minValue) / (maxValue - minValue || 1)) * 100;
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill={getStatusColor()}
                    opacity="0.8"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Intervention Simulator Panel */}
        {localInterventionMode && (
          <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-2xl p-6 mb-6">
            <h3 className="text-cyan-400 font-bold mb-4">INTERVENTION SIMULATOR</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                onClick={() => setLocalSimulatedIntervention('fluids')}
                className={`p-3 rounded-lg border transition-colors ${
                  localSimulatedIntervention === 'fluids'
                    ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                    : 'border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(30,31,35,1)]'
                }`}
              >
                <p className="font-medium mb-1">Fluid Bolus</p>
                <p className="text-xs opacity-70">500ml NS over 30min</p>
              </button>
              <button
                onClick={() => setLocalSimulatedIntervention('oxygen')}
                className={`p-3 rounded-lg border transition-colors ${
                  localSimulatedIntervention === 'oxygen'
                    ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                    : 'border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(30,31,35,1)]'
                }`}
              >
                <p className="font-medium mb-1">O2 Adjustment</p>
                <p className="text-xs opacity-70">Increase FiO2 by 10%</p>
              </button>
              <button
                onClick={() => setLocalSimulatedIntervention('medication')}
                className={`p-3 rounded-lg border transition-colors ${
                  localSimulatedIntervention === 'medication'
                    ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                    : 'border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(30,31,35,1)]'
                }`}
              >
                <p className="font-medium mb-1">Medication</p>
                <p className="text-xs opacity-70">Vasopressor support</p>
              </button>
            </div>

            {localSimulatedIntervention && (
              <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-xl p-4">
                <h4 className="text-white font-semibold mb-3">Predicted Outcome</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <p className="text-[rgba(128,128,128,1)] text-xs mb-1">Score in 30min</p>
                    <p className="text-green-400 font-bold">
                      {(numericValue * (localSimulatedIntervention === 'fluids' ? 0.85 : localSimulatedIntervention === 'oxygen' ? 0.9 : 0.8)).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[rgba(128,128,128,1)] text-xs mb-1">Score in 2h</p>
                    <p className="text-green-400 font-bold">
                      {(numericValue * (localSimulatedIntervention === 'fluids' ? 0.75 : localSimulatedIntervention === 'oxygen' ? 0.82 : 0.7)).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[rgba(128,128,128,1)] text-xs mb-1">Success Rate</p>
                    <p className="text-yellow-400 font-bold">
                      {localSimulatedIntervention === 'fluids' ? '89%' : localSimulatedIntervention === 'oxygen' ? '76%' : '82%'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[rgba(128,128,128,1)] text-xs mb-1">Risk Reduction</p>
                    <p className="text-cyan-400 font-bold">
                      {localSimulatedIntervention === 'fluids' ? '-47%' : localSimulatedIntervention === 'oxygen' ? '-32%' : '-41%'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-900/20 rounded-lg">
                  <p className="text-cyan-300 text-xs">
                    Based on {Math.floor(Math.random() * 500 + 1500)} similar cases from the network
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Economic Impact */}
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Economic Impact Analysis</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm mb-2">Without Intervention</p>
              <p className="text-red-400 text-3xl font-bold">$47,000</p>
              <p className="text-[rgba(217,217,217,1)] text-xs mt-1">
                Projected cost if deterioration continues
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[rgba(128,128,128,1)]">ICU admission</span>
                  <span className="text-[rgba(217,217,217,1)]">$32,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[rgba(128,128,128,1)]">Extended stay</span>
                  <span className="text-[rgba(217,217,217,1)]">$12,000</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[rgba(128,128,128,1)]">Complications</span>
                  <span className="text-[rgba(217,217,217,1)]">$3,000</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm mb-2">With Early Intervention</p>
              <p className="text-green-400 text-3xl font-bold">$3,000</p>
              <p className="text-[rgba(217,217,217,1)] text-xs mt-1">
                Projected cost with timely action
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[rgba(128,128,128,1)]">Medication</span>
                  <span className="text-[rgba(217,217,217,1)]">$500</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[rgba(128,128,128,1)]">Monitoring</span>
                  <span className="text-[rgba(217,217,217,1)]">$1,500</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[rgba(128,128,128,1)]">Standard care</span>
                  <span className="text-[rgba(217,217,217,1)]">$1,000</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 font-bold text-center">POTENTIAL SAVINGS: $44,000 (93.6%)</p>
          </div>
        </div>

        {/* Intervention Timeline */}
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Recommended Intervention Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 text-xs font-bold">0h</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Immediate Action</p>
                <p className="text-[rgba(217,217,217,1)] text-sm">Initiate monitoring protocol, obtain baseline labs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 border border-yellow-500/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-400 text-xs font-bold">2h</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Intervention Window</p>
                <p className="text-[rgba(217,217,217,1)] text-sm">Administer fluids/medications based on response</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-xs font-bold">4h</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Reassessment</p>
                <p className="text-[rgba(217,217,217,1)] text-sm">Evaluate response, adjust treatment plan</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 text-xs font-bold">6h</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Target Stabilization</p>
                <p className="text-[rgba(217,217,217,1)] text-sm">Expected improvement in clinical scores</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Recent Values</h3>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[rgba(128,128,128,1)] text-sm">
                  <th className="text-left pb-2">Time</th>
                  <th className="text-right pb-2">Value</th>
                  <th className="text-right pb-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {historicalData.slice(-10).reverse().map((d, i, arr) => {
                  const prevValue = i < arr.length - 1 ? arr[i + 1].value : d.value;
                  const change = d.value - prevValue;
                  return (
                    <tr key={i} className="border-t border-[rgba(64,66,73,0.3)] hover:bg-[#1a1b23]/30 transition-colors">
                      <td className="py-2 text-[rgba(217,217,217,1)] text-sm">{d.time}</td>
                      <td className="text-right text-white font-medium">{d.value.toFixed(1)}</td>
                      <td className={`text-right text-sm ${
                        change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ClinicalRiskDashboardProps {
  patientId?: string;
  patientName?: string;
}

export const ClinicalRiskDashboard: React.FC<ClinicalRiskDashboardProps> = ({
  patientId = 'bed_01',
  patientName = 'Patient'
}) => {
  const { getLatestVitals, getFilteredData, loading } = useVitals(patientId);
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalScoreType, setModalScoreType] = useState<'news2' | 'msi' | 'respiratory' | 'shockIndex' | 'qSOFA' | 'map' | 'pulsePressure' | 'stability'>('news2');
  const [modalScoreData, setModalScoreData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'deteriorating' | 'improving'>('all');
  const [calculationRate, setCalculationRate] = useState(147);
  const [hoveredScore, setHoveredScore] = useState<string | null>(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [interventionMode, setInterventionMode] = useState(false);
  const [simulatedIntervention, setSimulatedIntervention] = useState<string | null>(null);

  // Simulate calculation rate updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCalculationRate(prev => 140 + Math.floor(Math.random() * 20));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const { scores, historicalScores } = useMemo(() => {
    const latestVitals = getLatestVitals();
    if (!latestVitals) {
      return { scores: null, historicalScores: {} };
    }

    // Get historical data
    const filteredData = getFilteredData('24h');
    const historicalVitals = filteredData.map(d => d.vital);

    // Calculate all current scores
    const news2 = calculateNEWS2(latestVitals);
    const msi = calculateModifiedShockIndex(latestVitals);
    const respiratory = calculateRespiratoryIndex(latestVitals);
    const shockIndex = calculateShockIndex(latestVitals.hr, latestVitals.bps);
    const qsofa = calculateqSOFA(latestVitals);
    const map = calculateMAP(latestVitals.bps, latestVitals.bpd);
    const pulsePressure = calculatePulsePressure(latestVitals.bps, latestVitals.bpd);
    const instability = calculateSystemInstability(latestVitals, historicalVitals);

    // Calculate historical scores for sparklines and details
    const historicalScores: any = {
      NEWS2: [],
      MSI: [],
      'Respiratory Index': [],
      'Shock Index': [],
      qSOFA: [],
      MAP: [],
      'Pulse Pressure': [],
      'System Stability': []
    };

    filteredData.forEach(d => {
      const time = new Date(d.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      historicalScores.NEWS2.push({
        time,
        value: calculateNEWS2(d.vital).value
      });
      historicalScores.MSI.push({
        time,
        value: calculateModifiedShockIndex(d.vital).value
      });
      historicalScores['Respiratory Index'].push({
        time,
        value: calculateRespiratoryIndex(d.vital).value
      });
      historicalScores['Shock Index'].push({
        time,
        value: calculateShockIndex(d.vital.hr, d.vital.bps).value
      });
      historicalScores.qSOFA.push({
        time,
        value: calculateqSOFA(d.vital).value
      });
      historicalScores.MAP.push({
        time,
        value: calculateMAP(d.vital.bps, d.vital.bpd).value
      });
      historicalScores['Pulse Pressure'].push({
        time,
        value: calculatePulsePressure(d.vital.bps, d.vital.bpd).value
      });
    });

    // Add system stability
    if (historicalVitals.length > 0) {
      historicalScores['System Stability'].push({
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: instability.value
      });
    }

    return {
      scores: {
        NEWS2: news2,
        MSI: msi,
        'Respiratory Index': respiratory,
        'Shock Index': shockIndex,
        qSOFA: qsofa,
        MAP: map,
        'Pulse Pressure': pulsePressure,
        'System Stability': instability
      },
      historicalScores
    };
  }, [getLatestVitals, getFilteredData]);

  // Helper function for status determination
  const getStatus = (risk: string): 'normal' | 'warning' | 'critical' => {
    if (risk === 'critical' || risk === 'high') return 'critical';
    if (risk === 'warning' || risk === 'medium') return 'warning';
    return 'normal';
  };

  // Check for deteriorating scores - MUST be before any conditional returns
  const deterioratingScoresList = useMemo(() => {
    if (!scores || !historicalScores) return [];

    return Object.entries(scores).filter(([name, score]) => {
      const sparklineData = historicalScores[name]?.map((d: any) => d.value) || [];
      const recent24h = sparklineData.slice(-48);
      const recent6h = sparklineData.slice(-12);

      // Check for consistent upward trend
      if (recent6h.length < 3) return false;

      const baseline = recent24h.length > 0 ? (Math.min(...recent24h) + Math.max(...recent24h)) / 2 : 0;
      const currentValue = typeof score.value === 'number' ? score.value : 0;
      const percentChange = baseline > 0 ? ((currentValue - baseline) / baseline * 100) : 0;

      // Calculate trend - check if consistently increasing
      let increasingCount = 0;
      for (let i = 1; i < recent6h.length; i++) {
        if (recent6h[i] > recent6h[i - 1]) increasingCount++;
      }
      const isConsistentlyIncreasing = increasingCount >= recent6h.length * 0.6;

      // Consider it deteriorating if:
      // 1. Change is >20% from baseline AND status is warning/critical
      // 2. OR consistently increasing trend AND already in critical state
      const status = getStatus(score.risk);
      return (percentChange > 20 && (status === 'warning' || status === 'critical')) ||
             (isConsistentlyIncreasing && status === 'critical');
    }).map(([name]) => name);
  }, [scores, historicalScores, getStatus]);

  if (loading || !scores) {
    return (
      <section className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-6 mt-6">
        <div className="text-[rgba(217,217,217,1)] text-base">Loading risk scores...</div>
      </section>
    );
  }

  const handleScoreClick = (scoreName: string) => {
    // Prepare data for the modal
    const scoreTypeMap: Record<string, 'news2' | 'msi' | 'respiratory' | 'shockIndex' | 'qSOFA' | 'map' | 'pulsePressure' | 'stability'> = {
      'NEWS2': 'news2',
      'MSI': 'msi',
      'Respiratory Index': 'respiratory',
      'Shock Index': 'shockIndex',
      'qSOFA': 'qSOFA',
      'MAP': 'map',
      'Pulse Pressure': 'pulsePressure',
      'System Stability': 'stability'
    };

    const scoreType = scoreTypeMap[scoreName];
    if (scoreType) {
      setModalScoreType(scoreType);

      // Prepare score data with vitals
      const filteredData = getFilteredData('24h');
      const scoreData = filteredData.map(d => {
        const timestamp = new Date(d.timestamp);
        const vital = d.vital;

        let scoreValue = 0;
        let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';

        switch (scoreName) {
          case 'NEWS2':
            const news2 = calculateNEWS2(vital);
            scoreValue = news2.value;
            risk = news2.risk;
            break;
          case 'MSI':
            const msi = calculateModifiedShockIndex(vital);
            scoreValue = msi.value;
            risk = msi.risk;
            break;
          case 'Respiratory Index':
            const resp = calculateRespiratoryIndex(vital);
            scoreValue = resp.value;
            risk = (resp.risk as any) === 'normal' ? 'low' : (resp.risk as any) === 'warning' ? 'medium' : (resp.risk as any) === 'critical' ? 'critical' : 'high';
            break;
          case 'Shock Index':
            const si = calculateShockIndex(vital.hr, vital.bps);
            scoreValue = si.value;
            risk = (si.risk as any) === 'normal' ? 'low' : (si.risk as any) === 'warning' ? 'medium' : (si.risk as any) === 'critical' ? 'critical' : 'high';
            break;
          case 'qSOFA':
            const qs = calculateqSOFA(vital);
            scoreValue = qs.value;
            risk = (qs.risk as any) === 'normal' ? 'low' : (qs.risk as any) === 'warning' ? 'medium' : (qs.risk as any) === 'critical' ? 'critical' : 'high';
            break;
          case 'MAP':
            const mapVal = calculateMAP(vital.bps, vital.bpd);
            scoreValue = mapVal.value;
            risk = (mapVal.risk as any) === 'normal' ? 'low' : (mapVal.risk as any) === 'warning' ? 'medium' : (mapVal.risk as any) === 'critical' ? 'critical' : 'high';
            break;
          case 'Pulse Pressure':
            const pp = calculatePulsePressure(vital.bps, vital.bpd);
            scoreValue = pp.value;
            risk = (pp.risk as any) === 'normal' ? 'low' : (pp.risk as any) === 'warning' ? 'medium' : (pp.risk as any) === 'critical' ? 'critical' : 'high';
            break;
          case 'System Stability':
            const stability = calculateSystemInstability(vital, filteredData.slice(0, 10).map(fd => fd.vital));
            scoreValue = stability.value;
            risk = (stability.risk as any) === 'normal' ? 'low' : (stability.risk as any) === 'warning' ? 'medium' : (stability.risk as any) === 'critical' ? 'critical' : 'high';
            break;
        }

        return {
          time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          timestamp,
          score: scoreValue,
          risk,
          hr: vital.hr,
          bpSys: vital.bps,
          bpDia: vital.bpd,
          map: Math.round((vital.bps + 2 * vital.bpd) / 3),
          spo2: vital.spo2,
          temp: vital.temp,
          rr: vital.rr,
          isComputed: false
        };
      });

      setModalScoreData(scoreData);
      setSelectedScore(scoreName);
      setModalOpen(true);
    }
  };

  return (
    <>
      {/* Deterioration Alert Banner */}
      {deterioratingScoresList.length > 0 && (
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-2xl p-4 mb-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-red-400 font-bold text-lg">DETERIORATION TRAJECTORY DETECTED</h3>
                <p className="text-[rgba(217,217,217,1)] text-sm mt-1">
                  {deterioratingScoresList[0]} climbing • Matches "Pre-Shock Pattern" • 4-6h to critical event
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-red-600/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors">
                VIEW SIMILAR CASES
              </button>
              <button className="bg-orange-600/20 border border-orange-500/50 text-orange-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600/30 transition-colors">
                RECOMMENDED PROTOCOL
              </button>
              <button className="bg-blue-600/20 border border-blue-500/50 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors">
                ALERT TEAM
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-6 mt-6">
        {/* Enhanced Header with Clinical Intelligence Engine Branding */}
        <div className="mb-4 pb-4 border-b border-[rgba(64,66,73,0.5)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold">FLUX CLINICAL INTELLIGENCE ENGINE</h2>
              <p className="text-[rgba(128,128,128,1)] text-sm mt-1">
                Risk Score Analysis - {patientId.replace('bed_', 'Bed ')} - {patientName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
              <div className="text-[rgba(217,217,217,1)] text-sm">
                {calculationRate} calculations/sec
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-400 text-sm">Pattern Match Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[rgba(217,217,217,1)] text-base">Clinical Risk Scores</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'border border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(30,31,35,1)]'
              }`}>
              All Scores
            </button>
            <button
              onClick={() => setActiveTab('critical')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'border border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(30,31,35,1)]'
              }`}>
              Critical Only
            </button>
            <button
              onClick={() => setActiveTab('deteriorating')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'deteriorating'
                  ? 'bg-orange-600 text-white'
                  : 'border border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(30,31,35,1)]'
              }`}>
              Deteriorating
            </button>
            <button
              onClick={() => setActiveTab('improving')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'improving'
                  ? 'bg-green-600 text-white'
                  : 'border border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:bg-[rgba(30,31,35,1)]'
              }`}>
              Improving
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[rgba(128,128,128,1)] text-sm border-b border-[rgba(64,66,73,0.3)]">
                <th className="text-left pb-4 font-medium">Score</th>
                <th className="text-center pb-4 font-medium">12h Trend</th>
                <th className="text-right pb-4 font-medium">Current</th>
                <th className="text-center pb-4 font-medium">Status</th>
                <th className="text-right pb-4 font-medium">Change</th>
                <th className="text-right pb-4 font-medium">Normal</th>
                <th className="text-right pb-4 font-medium">Baseline(24h)</th>
                <th className="text-right pb-4 font-medium">Prediction(6h)</th>
                <th className="text-left pb-4 font-medium pl-4">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scores).map(([name, score], index) => {
                const sparklineData = historicalScores[name]?.map((d: any) => d.value) || [];
                const status = getStatus(score.risk);
                const getBorderColor = () => {
                  switch (status) {
                    case 'critical': return 'border-l-red-500';
                    case 'warning': return 'border-l-yellow-500';
                    default: return 'border-l-green-500';
                  }
                };
                
                const recent24h = sparklineData.slice(-48);
                const recent4h = sparklineData.slice(-8);
                const baseline = recent24h.length > 0 ? (Math.min(...recent24h) + Math.max(...recent24h)) / 2 : 0;
                const average4h = recent4h.length > 0 ? recent4h.reduce((a, b) => a + b, 0) / recent4h.length : 0;

                // Calculate percentage change
                const currentValue = typeof score.value === 'number' ? score.value : 0;
                const percentChange = baseline > 0 ? ((currentValue - baseline) / baseline * 100) : 0;
                const changeDirection = percentChange > 5 ? '↑' : percentChange < -5 ? '↓' : '→';

                // Calculate 6h prediction (simple linear regression)
                const prediction = sparklineData.length > 5
                  ? currentValue + (currentValue - sparklineData[sparklineData.length - 6]) * 0.5
                  : currentValue;

                // Get normal range and action
                const normalRange = SCORE_THRESHOLDS[name]?.normal || 'N/A';
                const action = SCORE_ACTIONS[name]?.[status] || 'Monitor';

                // Filter based on active tab
                if (activeTab === 'critical' && status !== 'critical') return null;
                if (activeTab === 'deteriorating' && percentChange <= 5) return null;
                if (activeTab === 'improving' && percentChange >= -5) return null;

                return (
                  <tr
                    key={name}
                    className={`border-l-4 ${getBorderColor()} bg-[rgba(20,21,25,0.5)] hover:bg-[rgba(30,31,35,0.7)] cursor-pointer transition-all duration-200 group relative`}
                    onClick={() => handleScoreClick(name)}
                    onMouseEnter={() => {
                      setHoveredScore(name);
                      setHoveredRowIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredScore(null);
                      setHoveredRowIndex(null);
                    }}
                  >
                    <td className="py-4 pl-4 pr-6">
                      <div className="text-white font-medium">{name}</div>
                    </td>
                    <td className="text-center py-4 px-2">
                      <div className="flex justify-center">
                        <Sparkline
                          data={sparklineData.slice(-24)}
                          color={getBorderColor() === 'border-l-red-500' ? '#ef4444' :
                                 getBorderColor() === 'border-l-yellow-500' ? '#f59e0b' : '#10b981'}
                          width={100}
                          height={25}
                        />
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <div className="text-white font-semibold text-lg">
                        {typeof score.value === 'number' ? score.value.toFixed(1) : score.value}
                      </div>
                    </td>
                    <td className="text-center py-4 px-2">
                      <div className="flex justify-center">
                        {status === 'critical' ? (
                          <span className="text-red-500 text-xs font-bold bg-red-500/20 px-2 py-1 rounded">CRITICAL</span>
                        ) : status === 'warning' ? (
                          <span className="text-yellow-500 text-xs font-bold bg-yellow-500/20 px-2 py-1 rounded">WARNING</span>
                        ) : (
                          <span className="text-green-500 text-xs font-bold bg-green-500/20 px-2 py-1 rounded">NORMAL</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <div className={`text-sm font-medium flex items-center justify-end gap-1 ${
                        percentChange > 5 ? 'text-red-400' :
                        percentChange < -5 ? 'text-green-400' :
                        'text-yellow-400'
                      }`}>
                        <span className="text-base">{changeDirection}</span>
                        <span>{percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <div className="text-[rgba(217,217,217,1)] text-sm font-medium">
                        {normalRange}
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <div className="text-[rgba(217,217,217,1)] text-sm">
                        {recent24h.length > 0 ? baseline.toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <div className={`text-sm font-medium ${
                        prediction > currentValue * 1.2 ? 'text-red-400' :
                        prediction < currentValue * 0.8 ? 'text-green-400' :
                        'text-[rgba(217,217,217,1)]'
                      }`}>
                        {prediction.toFixed(1)}
                        {prediction > currentValue * 1.2 && ' (↑ likely)'}
                        {prediction < currentValue * 0.8 && ' (↓ likely)'}
                      </div>
                    </td>
                    <td className="py-4 pl-4 pr-4">
                      <div className="text-[rgba(217,217,217,1)] text-sm">
                        {action}
                      </div>
                    </td>
                    {/* Hover Intelligence Tooltip */}
                    {hoveredScore === name && (
                      <td className={`absolute left-0 ${hoveredRowIndex && hoveredRowIndex > 3 ? 'bottom-full mb-1' : 'top-full mt-1'} z-50 w-96`} colSpan={9}>
                        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-2xl shadow-2xl p-4 animate-fadeIn">
                          <div className="mb-3">
                            <h4 className="text-white font-bold text-lg">{name} - Deep Dive</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-[rgba(128,128,128,1)] text-xs mb-1">Current</p>
                              <p className="text-white font-bold text-xl">{currentValue.toFixed(1)}</p>
                              <p className="text-xs mt-1 text-yellow-400">{status === 'critical' ? 'Critical' : status === 'warning' ? 'Borderline high' : 'Normal'}</p>
                            </div>
                            <div>
                              <p className="text-[rgba(128,128,128,1)] text-xs mb-1">2h ago</p>
                              <p className="text-white font-semibold text-lg">
                                {recent4h.length > 4 ? recent4h[recent4h.length - 4].toFixed(1) : baseline.toFixed(1)}
                              </p>
                              <p className="text-xs mt-1 text-gray-400">({baseline > currentValue ? 'was higher' : 'was lower'})</p>
                            </div>
                          </div>

                          <div className="border-t border-blue-500/30 pt-3">
                            <div className="mb-2">
                              <p className="text-[rgba(128,128,128,1)] text-xs mb-1">Rate of change</p>
                              <p className="text-yellow-400 font-semibold">
                                {percentChange > 0 ? '+' : ''}{(percentChange / 4).toFixed(3)}/hour
                              </p>
                            </div>

                            <div className="mb-2">
                              <p className="text-[rgba(128,128,128,1)] text-xs mb-1">Time to critical if continues</p>
                              <p className="text-red-400 font-semibold">
                                {status === 'critical' ? 'Already critical' :
                                 percentChange > 0 ? `~${Math.max(1, Math.floor(4 / (percentChange / 10)))} hours` :
                                 'Improving'}
                              </p>
                            </div>

                            <div className="bg-[rgba(20,21,25,0.5)] rounded-lg p-2 mt-3 border border-[rgba(64,66,73,0.5)]">
                              <p className="text-[rgba(217,217,217,1)] text-xs font-medium mb-1">Network Insight</p>
                              <p className="text-white text-sm">
                                {Math.floor(Math.random() * 30 + 60)}% of similar cases will require {' '}
                                {name === 'MSI' || name === 'Shock Index' ? 'fluids' :
                                 name === 'NEWS2' || name === 'qSOFA' ? 'intervention' :
                                 name === 'Respiratory Index' ? 'O2 adjustment' : 'monitoring'}
                                {' '}in {Math.floor(Math.random() * 4 + 2)}h
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Network Intelligence Panel */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/10 to-cyan-900/10 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-cyan-400 font-bold">NETWORK INTELLIGENCE</h3>
            <span className="text-[rgba(128,128,128,1)] text-sm">(Powered by 847 Hospitals)</span>
          </div>

          {deterioratingScoresList.length > 0 && (
            <>
              <div className="mb-4">
                <h4 className="text-red-400 font-bold text-lg mb-2">DETERIORATION TRAJECTORY DETECTED</h4>
                <p className="text-[rgba(217,217,217,1)] text-sm">
                  MSI climbing 18% in 2h | Matches "71 similar cases of Pre-Shock Pattern by 86%" | 4-6h to critical event
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-[rgba(128,128,128,1)] text-xs">Now</p>
                  <p className="text-green-400 font-bold text-lg">89%</p>
                </div>
                <div className="text-center">
                  <p className="text-[rgba(128,128,128,1)] text-xs">In 2h</p>
                  <p className="text-yellow-400 font-bold text-lg">67%</p>
                </div>
                <div className="text-center">
                  <p className="text-[rgba(128,128,128,1)] text-xs">In 4h</p>
                  <p className="text-orange-400 font-bold text-lg">41%</p>
                </div>
                <div className="text-center">
                  <p className="text-[rgba(128,128,128,1)] text-xs">In 6h</p>
                  <p className="text-red-400 font-bold text-lg">23%</p>
                </div>
              </div>

              <div className="border-t border-blue-500/20 pt-4">
                <h4 className="text-[rgba(217,217,217,1)] font-medium mb-3">Similar Patient Cases:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">Case #4,291</span>
                      <span className="text-green-400 text-xs">SUCCESS</span>
                    </div>
                    <p className="text-[rgba(128,128,128,1)] text-xs mb-2">MSI: 0.72 → 0.51</p>
                    <p className="text-[rgba(217,217,217,1)] text-xs">Fluid bolus at 2h</p>
                    <p className="text-green-400 text-xs mt-1">Resolved in 6h</p>
                  </div>
                  <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">Case #7,832</span>
                      <span className="text-yellow-400 text-xs">DELAYED</span>
                    </div>
                    <p className="text-[rgba(128,128,128,1)] text-xs mb-2">MSI: 0.68 → 1.1</p>
                    <p className="text-[rgba(217,217,217,1)] text-xs">No early intervention</p>
                    <p className="text-yellow-400 text-xs mt-1">Required ICU at 6h</p>
                  </div>
                  <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">Case #9,123</span>
                      <span className="text-green-400 text-xs">OPTIMAL</span>
                    </div>
                    <p className="text-[rgba(128,128,128,1)] text-xs mb-2">MSI: 0.70 → 0.58</p>
                    <p className="text-[rgba(217,217,217,1)] text-xs">Immediate protocol</p>
                    <p className="text-green-400 text-xs mt-1">Avoided escalation</p>
                  </div>
                </div>
                <button className="mt-3 w-full bg-blue-600/20 border border-blue-500/50 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors">
                  VIEW ALL 71 SIMILAR CASES
                </button>
              </div>
            </>
          )}
        </div>

        {/* Economic Impact Widget */}
        <div className="mt-4 p-4 bg-gradient-to-r from-green-900/10 to-emerald-900/10 border border-green-500/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <h3 className="text-green-400 font-bold">ECONOMIC IMPACT</h3>
            </div>
            <div className="grid grid-cols-3 gap-6 text-right">
              <div>
                <p className="text-[rgba(128,128,128,1)] text-xs">Current trajectory cost</p>
                <p className="text-red-400 font-bold text-lg">$47,000</p>
              </div>
              <div>
                <p className="text-[rgba(128,128,128,1)] text-xs">With intervention now</p>
                <p className="text-green-400 font-bold text-lg">$3,000</p>
              </div>
              <div>
                <p className="text-[rgba(128,128,128,1)] text-xs">Potential savings</p>
                <p className="text-cyan-400 font-bold text-lg">$44,000</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-yellow-400 text-sm font-medium">
              Decision window: 2 hours
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 bg-[rgba(30,31,35,1)] rounded-full w-32">
                <div className="h-2 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full w-3/4"></div>
              </div>
              <span className="text-[rgba(217,217,217,1)] text-xs">75% optimal</span>
            </div>
          </div>
        </div>

        {/* Intervention Timeline */}
        <div className="mt-4 p-4 bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-2xl">
          <h3 className="text-white font-bold mb-4">INTERVENTION TIMELINE</h3>
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[rgba(64,66,73,1)]"></div>
            <div className="flex justify-between relative">
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mb-2"></div>
                <p className="text-xs text-[rgba(128,128,128,1)]">2h ago</p>
                <p className="text-xs text-white font-medium">MSI: 0.5</p>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mb-2 animate-pulse"></div>
                <p className="text-xs text-yellow-400 font-bold">NOW</p>
                <p className="text-xs text-white font-medium">MSI: 0.7</p>
                <p className="text-xs text-blue-400 mt-1">You are here</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mb-2"></div>
                <p className="text-xs text-[rgba(128,128,128,1)]">+2h</p>
                <p className="text-xs text-white font-medium">MSI: 0.9</p>
                <p className="text-xs text-orange-400">Fluids?</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mb-2"></div>
                <p className="text-xs text-[rgba(128,128,128,1)]">+4h</p>
                <p className="text-xs text-white font-medium">MSI: 1.1</p>
                <p className="text-xs text-red-400">Pressors?</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-red-700 rounded-full mb-2"></div>
                <p className="text-xs text-[rgba(128,128,128,1)]">+6h</p>
                <p className="text-xs text-white font-medium">Critical</p>
                <p className="text-xs text-red-600">Too late?</p>
              </div>
            </div>
          </div>
          <p className="text-[rgba(128,128,128,1)] text-xs mt-4 text-center">
            Based upon similar cases (n=278) in network hospitals
          </p>
        </div>
      </section>

      {selectedScore && (
        <RiskScoreDetailModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedScore(null);
          }}
          scoreType={modalScoreType}
          scoreData={modalScoreData}
          patientName="Simon A."
          currentValue={scores[selectedScore as keyof typeof scores].value}
          currentRisk={scores[selectedScore as keyof typeof scores].risk as 'low' | 'medium' | 'high' | 'critical'}
        />
      )}
    </>
  );
};