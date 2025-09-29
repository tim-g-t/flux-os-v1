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

        <h2 className="text-white text-2xl font-bold mb-6">{scoreName}</h2>

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

export const ClinicalRiskDashboard: React.FC = () => {
  const { getLatestVitals, getFilteredData, loading } = useVitals('bed_15');
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalScoreType, setModalScoreType] = useState<'news2' | 'msi' | 'respiratory' | 'shockIndex' | 'qSOFA' | 'map' | 'pulsePressure' | 'stability'>('news2');
  const [modalScoreData, setModalScoreData] = useState<any[]>([]);

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

  if (loading || !scores) {
    return (
      <section className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-6 mt-6">
        <div className="text-[rgba(217,217,217,1)] text-base">Loading risk scores...</div>
      </section>
    );
  }

  const getStatus = (risk: string): 'normal' | 'warning' | 'critical' => {
    if (risk === 'critical' || risk === 'high') return 'critical';
    if (risk === 'warning' || risk === 'medium') return 'warning';
    return 'normal';
  };

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
      <section className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(scores).map(([name, score]) => {
            const sparklineData = historicalScores[name]?.map((d: any) => d.value) || [];
            return (
              <ScoreCard
                key={name}
                name={name}
                value={typeof score.value === 'number' ? score.value.toFixed(1) : score.value}
                sparklineData={sparklineData.slice(-20)} // Last 20 points for sparkline
                status={getStatus(score.risk)}
                onClick={() => handleScoreClick(name)}
              />
            );
          })}
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