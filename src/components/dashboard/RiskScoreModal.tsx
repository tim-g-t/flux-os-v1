import React, { useState, useMemo } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useVitals } from '@/hooks/useVitals';
import { calculateNEWS2, calculateModifiedShockIndex, calculateRespiratoryIndex, calculateSystemInstability } from '@/utils/clinicalScores';
import { calculateShockIndex, calculateqSOFA, calculateMAP, calculatePulsePressure } from '@/utils/riskCalculations';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, TooltipProps } from 'recharts';

interface RiskScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreName: string;
  currentValue: number | string;
  historicalData: Array<{ time: string; value: number }>; // kept for backward-compat (not used for range)
  status: 'normal' | 'warning' | 'critical';
  bedId?: string;
}

type TimeRange = '1h' | '4h' | '12h' | '24h' | '1w';
type VitalType = 'HR' | 'BP Sys' | 'BP Dia' | 'MAP' | 'SpO₂' | 'Temp' | 'RR';
type AxisMode = 'dual' | 'normalized';

// Define vital sign ranges for proper scaling
const VITAL_RANGES = {
  'HR': { min: 40, max: 160, unit: 'bpm' },
  'BP Sys': { min: 60, max: 200, unit: 'mmHg' },
  'BP Dia': { min: 40, max: 120, unit: 'mmHg' },
  'MAP': { min: 50, max: 150, unit: 'mmHg' },
  'SpO₂': { min: 80, max: 100, unit: '%' },
  'Temp': { min: 35, max: 42, unit: '°C' },
  'RR': { min: 8, max: 40, unit: '/min' }
};

// Get score range based on score type
const getScoreRange = (scoreName: string) => {
  switch (scoreName) {
    case 'MSI': return { min: 0, max: 2 };
    case 'Shock Index': return { min: 0, max: 1.5 };
    case 'NEWS2': return { min: 0, max: 15 };
    case 'qSOFA': return { min: 0, max: 3 };
    case 'Respiratory Index': return { min: 0, max: 3 };
    case 'MAP': return { min: 40, max: 120 };
    case 'Pulse Pressure': return { min: 10, max: 80 };
    default: return { min: 0, max: 10 };
  }
};

export const RiskScoreModal: React.FC<RiskScoreModalProps> = ({
  isOpen,
  onClose,
  scoreName,
  currentValue,
  historicalData,
  status,
  bedId = 'bed_15'
}) => {
  const { getFilteredData } = useVitals(bedId);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedVitals, setSelectedVitals] = useState<VitalType[]>([]);
  const [axisMode, setAxisMode] = useState<AxisMode>('dual');
  const [showVitalControls, setShowVitalControls] = useState(false);

  const vitalTypes: VitalType[] = ['HR', 'BP Sys', 'BP Dia', 'MAP', 'SpO₂', 'Temp', 'RR'];

  const { chartData, stats, thresholds } = useMemo(() => {
    const filteredData = getFilteredData(timeRange);

    const formatTime = (ts: string) =>
      new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Score calculation per point
    const getScoreValue = (vital: any, index: number, arr: typeof filteredData): number => {
      switch (scoreName) {
        case 'MSI':
          return calculateModifiedShockIndex(vital).value;
        case 'Shock Index':
          return calculateShockIndex(vital.hr, vital.bps).value;
        case 'NEWS2':
          return calculateNEWS2(vital).value;
        case 'Respiratory Index':
          return calculateRespiratoryIndex(vital).value;
        case 'qSOFA':
          return calculateqSOFA(vital).value;
        case 'MAP':
          return calculateMAP(vital.bps, vital.bpd).value;
        case 'Pulse Pressure':
          return calculatePulsePressure(vital.bps, vital.bpd).value;
        case 'System Stability': {
          const hist = arr.slice(Math.max(0, index - 30), index).map((d) => d.vital);
          return calculateSystemInstability(vital, hist).value;
        }
        default:
          return 0;
      }
    };

    // Create unified data structure for Recharts
    const processedData = filteredData.map((d, i, arr) => {
      const time = formatTime(d.timestamp);
      const score = getScoreValue(d.vital, i, arr);
      const hr = d.vital.hr;
      const bpSys = d.vital.bps;
      const bpDia = d.vital.bpd;
      const map = (d.vital.bps + 2 * d.vital.bpd) / 3;
      const spo2 = d.vital.spo2;
      const temp = d.vital.temp;
      const rr = d.vital.rr;

      // Calculate normalized values (0-100%)
      const normalize = (value: number, min: number, max: number) => 
        Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

      const scoreRange = getScoreRange(scoreName);
      
      return {
        time,
        score,
        hr,
        bpSys,
        bpDia,
        map,
        spo2,
        temp,
        rr,
        // Normalized versions (0-100%)
        scoreNormalized: normalize(score, scoreRange.min, scoreRange.max),
        hrNormalized: normalize(hr, VITAL_RANGES['HR'].min, VITAL_RANGES['HR'].max),
        bpSysNormalized: normalize(bpSys, VITAL_RANGES['BP Sys'].min, VITAL_RANGES['BP Sys'].max),
        bpDiaNormalized: normalize(bpDia, VITAL_RANGES['BP Dia'].min, VITAL_RANGES['BP Dia'].max),
        mapNormalized: normalize(map, VITAL_RANGES['MAP'].min, VITAL_RANGES['MAP'].max),
        spo2Normalized: normalize(spo2, VITAL_RANGES['SpO₂'].min, VITAL_RANGES['SpO₂'].max),
        tempNormalized: normalize(temp, VITAL_RANGES['Temp'].min, VITAL_RANGES['Temp'].max),
        rrNormalized: normalize(rr, VITAL_RANGES['RR'].min, VITAL_RANGES['RR'].max),
      };
    });

    const scoreValues = processedData.map((d) => d.score);
    const stats = {
      current: typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue)),
      min: scoreValues.length > 0 ? Math.min(...scoreValues) : 0,
      avg: scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0,
      max: scoreValues.length > 0 ? Math.max(...scoreValues) : 0
    };

    const thresholds = (() => {
      switch (scoreName) {
        case 'MSI':
          return { warning: 1.0, critical: 1.3 };
        case 'Shock Index':
          return { warning: 0.7, critical: 0.9 };
        case 'NEWS2':
          return { warning: 5, critical: 7 };
        case 'qSOFA':
          return { warning: 1, critical: 2 };
        case 'Respiratory Index':
          return { warning: 1.5, critical: 2.0 };
        case 'MAP':
          return { warning: 65, critical: 55 }; // lower is worse
        case 'Pulse Pressure':
          return { warning: 30, critical: 20 };
        default:
          return { warning: 0, critical: 0 };
      }
    })();

    // Calculate normalized thresholds for normalized mode
    const scoreRange = getScoreRange(scoreName);
    const normalizedThresholds = axisMode === 'normalized' ? {
      warning: ((thresholds.warning - scoreRange.min) / (scoreRange.max - scoreRange.min)) * 100,
      critical: ((thresholds.critical - scoreRange.min) / (scoreRange.max - scoreRange.min)) * 100
    } : thresholds;

    return { chartData: processedData, stats, thresholds: normalizedThresholds };
  }, [getFilteredData, timeRange, scoreName, currentValue, axisMode]);

  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const toggleVital = (vital: VitalType) => {
    setSelectedVitals(prev => 
      prev.includes(vital) 
        ? prev.filter(v => v !== vital)
        : [...prev, vital]
    );
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-black/90 border border-gray-600 rounded-lg p-3 shadow-xl">
        <p className="text-white text-sm font-medium mb-2">{label}</p>
        {payload.map((entry) => {
          const vital = entry.dataKey as string;
          const value = entry.value as number;
          
          // Get proper unit and formatting
          const getVitalInfo = (vital: string) => {
            if (vital === 'score') return { unit: '', label: scoreName };
            if (vital === 'scoreNormalized') return { unit: '%', label: `${scoreName} (norm)` };
            if (vital.endsWith('Normalized')) {
              const baseVital = vital.replace('Normalized', '') as VitalType;
              return { unit: '%', label: `${baseVital} (norm)` };
            }
            
            const vitalMap: Record<string, { unit: string; label: string }> = {
              hr: { unit: 'bpm', label: 'HR' },
              bpSys: { unit: 'mmHg', label: 'BP Sys' },
              bpDia: { unit: 'mmHg', label: 'BP Dia' },
              map: { unit: 'mmHg', label: 'MAP' },
              spo2: { unit: '%', label: 'SpO₂' },
              temp: { unit: '°C', label: 'Temp' },
              rr: { unit: '/min', label: 'RR' }
            };
            
            return vitalMap[vital] || { unit: '', label: vital };
          };

          const { unit, label } = getVitalInfo(vital);
          
          return (
            <div key={vital} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-0.5" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-gray-300">{label}:</span>
              <span className="text-white font-medium">
                {value?.toFixed(1)}{unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Get vital colors
  const getVitalColor = (vital: VitalType, index: number) => {
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  // Render chart using Recharts
  const renderChart = () => {
    if (chartData.length === 0) return null;

    const scoreRange = getScoreRange(scoreName);
    
    return (
      <div className="relative h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
            {/* Grid */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#404249" 
              opacity={0.3} 
            />
            
            {/* X Axis */}
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
            />
            
            {/* Left Y Axis (Vitals - only in dual mode) */}
            {axisMode === 'dual' && selectedVitals.length > 0 && (
              <YAxis
                yAxisId="vitals"
                orientation="left"
                domain={[
                  VITAL_RANGES[selectedVitals[0]].min,
                  VITAL_RANGES[selectedVitals[0]].max
                ]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                label={{ 
                  value: `${selectedVitals[0]} (${VITAL_RANGES[selectedVitals[0]].unit})`, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 10 }
                }}
              />
            )}
            
            {/* Right Y Axis (Scores) */}
            <YAxis
              yAxisId="score"
              orientation="right"
              domain={axisMode === 'normalized' ? [0, 100] : [scoreRange.min, scoreRange.max]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#D1D5DB' }}
              label={{ 
                value: axisMode === 'normalized' ? 'Normalized (%)' : scoreName, 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fill: '#D1D5DB', fontSize: 10 }
              }}
            />

            {/* Reference Lines (Thresholds) */}
            {thresholds.warning > 0 && (
              <ReferenceLine
                y={thresholds.warning}
                yAxisId="score"
                stroke="#f59e0b"
                strokeDasharray="8 4"
                strokeWidth={2}
                opacity={0.7}
              />
            )}
            {thresholds.critical > 0 && (
              <ReferenceLine
                y={thresholds.critical}
                yAxisId="score"
                stroke="#ef4444"
                strokeDasharray="8 4"
                strokeWidth={2}
                opacity={0.7}
              />
            )}

            {/* Risk Score Line (Primary, rendered first for tooltip priority) */}
            <Line
              dataKey={axisMode === 'normalized' ? 'scoreNormalized' : 'score'}
              yAxisId="score"
              stroke={getStatusColor()}
              strokeWidth={5}
              dot={{ r: 4, fill: getStatusColor() }}
              isAnimationActive={false}
              name={scoreName}
            />

            {/* Vital Signs (Areas and Lines) */}
            {selectedVitals.map((vital, index) => {
              const color = getVitalColor(vital, index);
              const dataKey = axisMode === 'normalized' 
                ? `${vital.toLowerCase().replace(' ', '')}Normalized` 
                : vital.toLowerCase().replace(' ', '');
              
              const yAxisId = axisMode === 'dual' ? 'vitals' : 'score';
              
              // Use Area for filled vitals (HR, SpO₂, Temp, RR)
              if (['HR', 'SpO₂', 'Temp', 'RR'].includes(vital)) {
                return (
                  <Area
                    key={vital}
                    dataKey={dataKey}
                    yAxisId={yAxisId}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                    name={vital}
                  />
                );
              }
              
              // Use Line for blood pressure vitals
              return (
                <Line
                  key={vital}
                  dataKey={dataKey}
                  yAxisId={yAxisId}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  name={vital}
                />
              );
            })}

            {/* Custom Tooltip */}
            <Tooltip content={CustomTooltip} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Enhanced Legend */}
        <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-3 space-y-1 max-w-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5" style={{ backgroundColor: getStatusColor() }} />
            <span className="text-white text-xs font-medium">{scoreName}</span>
            <span className="text-gray-400 text-xs">(right axis)</span>
          </div>
          {selectedVitals.map((vital, index) => {
            const color = getVitalColor(vital, index);
            return (
              <div key={vital} className="flex items-center gap-2">
                <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
                <span className="text-[rgba(217,217,217,1)] text-xs">{vital}</span>
                <span className="text-gray-400 text-xs">
                  ({axisMode === 'dual' ? 'left axis' : 'normalized'})
                </span>
              </div>
            );
          })}
          {axisMode === 'normalized' && (
            <div className="text-[rgba(128,128,128,1)] text-xs italic border-t border-gray-600 pt-1 mt-1">
              All values normalized 0-100%
            </div>
          )}
          {thresholds.warning > 0 && (
            <div className="text-xs space-y-0.5 border-t border-gray-600 pt-1 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-500 opacity-70" />
                <span className="text-gray-400">
                  Warning: {axisMode === 'normalized' ? `${thresholds.warning.toFixed(1)}%` : thresholds.warning.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-500 opacity-70" />
                <span className="text-gray-400">
                  Critical: {axisMode === 'normalized' ? `${thresholds.critical.toFixed(1)}%` : thresholds.critical.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[rgba(217,217,217,1)] hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-white text-2xl font-medium mb-4">{scoreName} Risk Score</h2>
          
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm mb-1">Current</p>
              <p className="text-white text-2xl font-bold">{stats.current.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm mb-1">Min</p>
              <p className="text-[rgba(217,217,217,1)] text-lg font-semibold">{stats.min.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm mb-1">Avg</p>
              <p className="text-[rgba(217,217,217,1)] text-lg font-semibold">{stats.avg.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[rgba(128,128,128,1)] text-sm mb-1">Max</p>
              <p className="text-[rgba(217,217,217,1)] text-lg font-semibold">{stats.max.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Add vitals button */}
          <button
            onClick={() => setShowVitalControls(!showVitalControls)}
            className="flex items-center gap-2 px-4 py-2 border border-[rgba(64,66,73,1)] rounded-[32px] text-[rgba(217,217,217,1)] hover:border-white hover:text-white transition-colors"
          >
            {showVitalControls ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Add vitals...
          </button>

          {/* Time range pills */}
          <div className="flex gap-2">
            {(['1h', '4h', '12h', '24h', '1w'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white text-black'
                    : 'border border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:border-white hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Axis mode toggle */}
          <div className="flex border border-[rgba(64,66,73,1)] rounded-[32px] overflow-hidden">
            <button
              onClick={() => setAxisMode('dual')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                axisMode === 'dual'
                  ? 'bg-white text-black'
                  : 'text-[rgba(217,217,217,1)] hover:text-white'
              }`}
            >
              Dual axes
            </button>
            <button
              onClick={() => setAxisMode('normalized')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                axisMode === 'normalized'
                  ? 'bg-white text-black'
                  : 'text-[rgba(217,217,217,1)] hover:text-white'
              }`}
            >
              Normalize
            </button>
          </div>
        </div>

        {/* Vital selection chips */}
        {showVitalControls && (
          <div className="flex flex-wrap gap-2 mb-6 p-4 border border-[rgba(64,66,73,1)] rounded-xl">
            {vitalTypes.map(vital => (
              <button
                key={vital}
                onClick={() => toggleVital(vital)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedVitals.includes(vital)
                    ? 'bg-blue-500 text-white'
                    : 'border border-[rgba(64,66,73,1)] text-[rgba(217,217,217,1)] hover:border-blue-500 hover:text-blue-400'
                }`}
              >
                {vital}
              </button>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="bg-[rgba(16,17,20,1)] rounded-xl p-6 mb-6">
          {renderChart()}
        </div>

        {/* Recent Values Table */}
        <div className="bg-[rgba(16,17,20,1)] rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Recent Values</h3>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[rgba(128,128,128,1)] text-sm border-b border-[rgba(64,66,73,0.3)]">
                  <th className="text-left pb-3">Time</th>
                  <th className="text-right pb-3">Value</th>
                  <th className="text-right pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(-10).reverse().map((d, i) => (
                  <tr key={i} className="border-b border-[rgba(64,66,73,0.1)]">
                    <td className="py-3 text-[rgba(217,217,217,1)] text-sm">{d.time}</td>
                    <td className="text-right text-white font-medium">
                      {d.score.toFixed(1)}
                      <span className="text-[rgba(128,128,128,1)] text-xs ml-1">computed</span>
                    </td>
                    <td className="text-right">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        d.score >= (axisMode === 'normalized' ? thresholds.critical : (thresholds.critical || 0)) ? 'bg-red-500' :
                        d.score >= (axisMode === 'normalized' ? thresholds.warning : (thresholds.warning || 0)) ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};