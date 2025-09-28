import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

interface VitalDataPoint {
  time: string;
  timestamp: Date;
  hr?: number;
  bpSys?: number;
  bpDia?: number;
  map?: number;
  spo2?: number;
  temp?: number;
  rr?: number;
}

interface RiskScoreDataPoint extends VitalDataPoint {
  score: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  isComputed?: boolean;
}

interface RiskScoreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreType: 'news2' | 'msi' | 'respiratory' | 'shockIndex' | 'qSOFA' | 'map' | 'pulsePressure' | 'stability';
  scoreData: RiskScoreDataPoint[];
  patientName?: string;
  currentValue: number;
  currentRisk: 'low' | 'medium' | 'high' | 'critical';
}

const SCORE_CONFIGS = {
  news2: {
    name: 'NEWS2 Score',
    unit: 'points',
    color: '#3B82F6',
    criticalThreshold: 7,
    warningThreshold: 5
  },
  msi: {
    name: 'Modified Shock Index',
    unit: 'ratio',
    color: '#8B5CF6',
    criticalThreshold: 1.7,
    warningThreshold: 1.3
  },
  respiratory: {
    name: 'Respiratory Index',
    unit: 'points',
    color: '#06B6D4',
    criticalThreshold: 6,
    warningThreshold: 4
  },
  shockIndex: {
    name: 'Shock Index',
    unit: 'ratio',
    color: '#F59E0B',
    criticalThreshold: 1.0,
    warningThreshold: 0.9
  },
  qSOFA: {
    name: 'qSOFA',
    unit: 'points',
    color: '#EF4444',
    criticalThreshold: 3,
    warningThreshold: 2
  },
  map: {
    name: 'MAP',
    unit: 'mmHg',
    color: '#10B981',
    criticalThreshold: 60,
    warningThreshold: 65,
    inverted: true
  },
  pulsePressure: {
    name: 'Pulse Pressure',
    unit: 'mmHg',
    color: '#EC4899',
    criticalThreshold: 80,
    warningThreshold: 60
  },
  stability: {
    name: 'System Stability',
    unit: '%',
    color: '#6366F1',
    criticalThreshold: 15,
    warningThreshold: 10
  }
};

const VITAL_CONFIGS = {
  hr: { label: 'HR', unit: 'bpm', color: '#94A3B8' },
  bpSys: { label: 'BP Sys', unit: 'mmHg', color: '#EF4444' },
  bpDia: { label: 'BP Dia', unit: 'mmHg', color: '#F97316' },
  map: { label: 'MAP', unit: 'mmHg', color: '#8B5CF6', strokeDasharray: '8,4' },
  spo2: { label: 'SpO₂', unit: '%', color: '#60A5FA' },
  temp: { label: 'Temp', unit: '°F', color: '#10B981' },
  rr: { label: 'RR', unit: '/min', color: '#F59E0B' }
};

type TimeRange = '1h' | '4h' | '12h' | '24h' | '1w';

export const RiskScoreDetailModal: React.FC<RiskScoreDetailModalProps> = ({
  isOpen,
  onClose,
  scoreType,
  scoreData,
  currentValue,
  currentRisk
}) => {
  const [selectedVitals, setSelectedVitals] = useState<string[]>([]);
  const [showVitalSelector, setShowVitalSelector] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [axisMode, setAxisMode] = useState<'dual' | 'normalized'>('dual');

  const config = SCORE_CONFIGS[scoreType];

  const processedData = useMemo(() => {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case '1h': cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '4h': cutoffTime = new Date(now.getTime() - 4 * 60 * 60 * 1000); break;
      case '12h': cutoffTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); break;
      case '24h': cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '1w': cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      default: cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    let filtered = scoreData.filter(d => d.timestamp >= cutoffTime);

    if (filtered.length === 0) return [];

    if (axisMode === 'normalized') {
      const scoreMin = Math.min(...filtered.map(d => d.score));
      const scoreMax = Math.max(...filtered.map(d => d.score));
      const scoreRange = scoreMax - scoreMin || 1;

      return filtered.map(point => {
        const normalized: any = {
          ...point,
          time: timeRange === '1w'
            ? format(point.timestamp, 'MMM d')
            : format(point.timestamp, 'HH:mm'),
          scoreNormalized: ((point.score - scoreMin) / scoreRange) * 100
        };

        selectedVitals.forEach(vital => {
          const value = point[vital as keyof VitalDataPoint] as number;
          if (value !== undefined) {
            const vitalValues = filtered.map(p => p[vital as keyof VitalDataPoint] as number).filter(v => v !== undefined);
            const vitalMin = Math.min(...vitalValues);
            const vitalMax = Math.max(...vitalValues);
            const vitalRange = vitalMax - vitalMin || 1;
            normalized[`${vital}Normalized`] = ((value - vitalMin) / vitalRange) * 100;
          }
        });

        return normalized;
      });
    }

    return filtered.map(point => ({
      ...point,
      time: timeRange === '1w'
        ? format(point.timestamp, 'MMM d')
        : timeRange === '12h' || timeRange === '24h'
          ? format(point.timestamp, 'HH')
          : format(point.timestamp, 'HH:mm')
    }));
  }, [scoreData, timeRange, axisMode, selectedVitals]);

  const statistics = useMemo(() => {
    if (processedData.length === 0) {
      return { current: currentValue, min: 0, max: 0, avg: 0 };
    }

    const values = processedData.map(d => d.score);
    return {
      current: currentValue,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    };
  }, [processedData, currentValue]);

  const recentValues = useMemo(() => {
    return scoreData
      .slice(-10)
      .reverse()
      .map(point => ({
        time: format(point.timestamp, 'HH:mm'),
        value: point.score,
        risk: point.risk,
        isComputed: point.isComputed
      }));
  }, [scoreData]);

  const toggleVital = (vital: string) => {
    setSelectedVitals(prev =>
      prev.includes(vital)
        ? prev.filter(v => v !== vital)
        : [...prev, vital]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">Time: {label}</p>
          {payload.map((entry: any, index: number) => {
            const isNormalized = axisMode === 'normalized';
            const value = isNormalized && entry.dataKey.includes('Normalized')
              ? `${entry.value.toFixed(1)}%`
              : entry.value.toFixed(1);
            const unit = !isNormalized ?
              (entry.dataKey === 'score' ? config.unit :
               VITAL_CONFIGS[entry.dataKey as keyof typeof VITAL_CONFIGS]?.unit || '')
              : '';

            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {value} {unit}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-0 bg-black border-[rgba(64,66,73,1)] overflow-hidden">
        <div className="bg-black border border-[rgba(64,66,73,1)] w-full mx-auto rounded-[32px]">
          {/* Header Section */}
          <div className="px-6 py-4 border-b border-[rgba(64,66,73,0.5)]">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-lg font-medium">
                {config.name}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Stats and Controls Section */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">

              {/* Stats Group */}
              <div className="flex items-start gap-12">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase mb-1">Current</span>
                  <span className="text-white text-2xl font-bold">{statistics.current.toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase mb-1">Min</span>
                  <span className="text-gray-300 text-xl">{statistics.min.toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase mb-1">Avg</span>
                  <span className="text-gray-300 text-xl">{statistics.avg.toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase mb-1">Max</span>
                  <span className="text-gray-300 text-xl">{statistics.max.toFixed(1)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVitalSelector(!showVitalSelector)}
                  className="text-gray-300 text-sm px-4 py-2 border border-gray-600 rounded-full hover:border-white hover:text-white transition-colors"
                >
                  {showVitalSelector ? '− Hide vitals' : '+ Add vitals...'}
                </button>
                {/* Time Range Buttons */}
                <div className="flex gap-1 ml-4">
                  {(['1h', '4h', '12h', '24h', '1w'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAxisMode(axisMode === 'dual' ? 'normalized' : 'dual')}
                  className="ml-2 text-gray-300 text-sm px-3 py-1.5 border border-gray-600 rounded-full hover:border-white hover:text-white transition-colors"
                >
                  {axisMode === 'dual' ? 'Dual axes' : 'Normalize'}
                </button>
              </div>
            </div>

            {/* Vital Selector Pills */}
            {showVitalSelector && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(64,66,73,0.5)]">
                {Object.entries(VITAL_CONFIGS).map(([key, vital]) => (
                  <button
                    key={key}
                    onClick={() => toggleVital(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedVitals.includes(key)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {vital.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chart Section */}
          <div className="px-6 pb-4">

            <div className="h-80 w-full">
              {processedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404249" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#9CA3AF" />

                    {axisMode === 'dual' ? (
                      <>
                        <YAxis
                          yAxisId="score"
                          orientation="right"
                          stroke={config.color}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        {selectedVitals.length > 0 && (
                          <YAxis
                            yAxisId="vitals"
                            orientation="left"
                            stroke="#9CA3AF"
                            domain={['dataMin - 5', 'dataMax + 5']}
                          />
                        )}
                      </>
                    ) : (
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        stroke="#9CA3AF"
                      />
                    )}

                    <Tooltip content={<CustomTooltip />} />

                    {/* Critical threshold lines - always visible (no animation) */}
                    <ReferenceLine
                      yAxisId={axisMode === 'dual' ? 'score' : undefined}
                      y={axisMode === 'normalized'
                        ? ((config.criticalThreshold - Math.min(...processedData.map(d => d.score))) /
                           (Math.max(...processedData.map(d => d.score)) - Math.min(...processedData.map(d => d.score)) || 1)) * 100
                        : config.criticalThreshold}
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      label={{ value: "Critical", position: "right", fill: "#EF4444" }}
                      isAnimationActive={false}
                    />

                    {config.warningThreshold && (
                      <ReferenceLine
                        yAxisId={axisMode === 'dual' ? 'score' : undefined}
                        y={axisMode === 'normalized'
                          ? ((config.warningThreshold - Math.min(...processedData.map(d => d.score))) /
                             (Math.max(...processedData.map(d => d.score)) - Math.min(...processedData.map(d => d.score)) || 1)) * 100
                          : config.warningThreshold}
                        stroke="#F59E0B"
                        strokeWidth={1}
                        strokeDasharray="8 4"
                        opacity={0.7}
                        isAnimationActive={false}
                      />
                    )}

                    {/* Risk Score Line - Primary (No animation) - 150% thicker */}
                    <Line
                      yAxisId={axisMode === 'dual' ? 'score' : undefined}
                      type="monotone"
                      dataKey={axisMode === 'normalized' ? 'scoreNormalized' : 'score'}
                      stroke={config.color}
                      strokeWidth={5}
                      dot={false}
                      name={config.name}
                      isAnimationActive={false}
                    />

                    {/* Vital Overlays with left-to-right animation */}
                    {selectedVitals.includes('hr') && (
                      <Area
                        yAxisId={axisMode === 'dual' ? 'vitals' : undefined}
                        type="monotone"
                        dataKey={axisMode === 'normalized' ? 'hrNormalized' : 'hr'}
                        stroke={VITAL_CONFIGS.hr.color}
                        fill={VITAL_CONFIGS.hr.color}
                        fillOpacity={0.3}
                        name="HR"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    )}

                    {selectedVitals.includes('bpSys') && (
                      <Line
                        yAxisId={axisMode === 'dual' ? 'vitals' : undefined}
                        type="monotone"
                        dataKey={axisMode === 'normalized' ? 'bpSysNormalized' : 'bpSys'}
                        stroke={VITAL_CONFIGS.bpSys.color}
                        strokeWidth={2}
                        dot={false}
                        name="BP Sys"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    )}

                    {selectedVitals.includes('bpDia') && (
                      <Line
                        yAxisId={axisMode === 'dual' ? 'vitals' : undefined}
                        type="monotone"
                        dataKey={axisMode === 'normalized' ? 'bpDiaNormalized' : 'bpDia'}
                        stroke={VITAL_CONFIGS.bpDia.color}
                        strokeWidth={2}
                        dot={false}
                        name="BP Dia"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    )}

                    {selectedVitals.includes('map') && (
                      <Line
                        yAxisId={axisMode === 'dual' ? 'vitals' : undefined}
                        type="monotone"
                        dataKey={axisMode === 'normalized' ? 'mapNormalized' : 'map'}
                        stroke={VITAL_CONFIGS.map.color}
                        strokeWidth={2}
                        strokeDasharray={VITAL_CONFIGS.map.strokeDasharray}
                        dot={false}
                        name="MAP"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    )}

                    {selectedVitals.includes('spo2') && (
                      <Area
                        yAxisId={axisMode === 'dual' ? 'vitals' : undefined}
                        type="monotone"
                        dataKey={axisMode === 'normalized' ? 'spo2Normalized' : 'spo2'}
                        stroke={VITAL_CONFIGS.spo2.color}
                        fill={VITAL_CONFIGS.spo2.color}
                        fillOpacity={0.3}
                        name="SpO₂"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    )}

                    {selectedVitals.includes('temp') && (
                      <Area
                        yAxisId={axisMode === 'dual' ? 'vitals' : undefined}
                        type="monotone"
                        dataKey={axisMode === 'normalized' ? 'tempNormalized' : 'temp'}
                        stroke={VITAL_CONFIGS.temp.color}
                        fill={VITAL_CONFIGS.temp.color}
                        fillOpacity={0.3}
                        name="Temp"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    )}

                    {selectedVitals.includes('rr') && (
                      <Area
                        yAxisId={axisMode === 'dual' ? 'vitals' : undefined}
                        type="monotone"
                        dataKey={axisMode === 'normalized' ? 'rrNormalized' : 'rr'}
                        stroke={VITAL_CONFIGS.rr.color}
                        fill={VITAL_CONFIGS.rr.color}
                        fillOpacity={0.3}
                        name="RR"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <p className="text-lg">No data for this period</p>
                  <button
                    onClick={() => setTimeRange('1w')}
                    className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Adjust time range
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Values Table */}
          <div className="px-6 pb-6">
            <h3 className="text-white text-sm font-medium mb-3 uppercase tracking-wider">Recent Values</h3>
            <div className="bg-gray-900/50 border border-[rgba(64,66,73,0.5)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(64,66,73,0.5)]">
                    <th className="text-left p-3 text-gray-500 text-xs font-normal uppercase">Time</th>
                    <th className="text-right p-3 text-gray-500 text-xs font-normal uppercase">Value</th>
                    <th className="text-right p-3 text-gray-500 text-xs font-normal uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentValues.map((value, index) => (
                    <tr key={index} className="border-b border-[rgba(64,66,73,0.3)] last:border-0">
                      <td className="p-3 text-gray-400 text-sm font-mono">{value.time}</td>
                      <td className="text-right p-3 text-white font-medium">
                        {value.value.toFixed(1)}
                        <span className="text-gray-500 text-xs ml-1">{value.isComputed ? 'computed' : ''}</span>
                      </td>
                      <td className="text-right p-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          value.risk === 'critical' ? 'bg-red-500' :
                          value.risk === 'high' ? 'bg-orange-500' :
                          value.risk === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};