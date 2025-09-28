import React, { useMemo, useEffect, useState } from 'react';
import { useVitals } from '@/hooks/useVitals';
import {
  calculateNEWS2,
  calculateModifiedShockIndex,
  calculateRespiratoryIndex,
  calculateSystemInstability,
  calculateRiskTrajectory,
  estimateTimeToEvent,
  ClinicalScore,
  RiskTrajectory
} from '@/utils/clinicalScores';
import { calculateShockIndex, calculateqSOFA, calculateMAP, calculatePulsePressure } from '@/utils/riskCalculations';
import { VitalReading } from '@/services/vitalsService';

interface ScoreCardProps {
  title: string;
  score: ClinicalScore | { value: number; risk: string; description: string };
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  lastUpdate?: string;
  critical?: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, subtitle, trend, lastUpdate, critical }) => {
  const getRiskColor = (risk: string) => {
    if (risk === 'critical' || risk === 'high') return 'bg-red-500';
    if (risk === 'warning' || risk === 'medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div className={`bg-black border rounded-2xl p-4 transition-all ${
      critical ? 'border-red-500 animate-pulse' : 'border-[rgba(64,66,73,1)]'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-base">{title}</h3>
          {subtitle && <p className="text-[rgba(128,128,128,1)] text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`w-3 h-3 rounded-full ${getRiskColor(score.risk)}`}></div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-white text-3xl font-bold">{score.value}</span>
        {trend && (
          <span className={`text-xl ${trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-gray-400'}`}>
            {getTrendIcon()}
          </span>
        )}
      </div>

      <p className="text-[rgba(217,217,217,1)] text-sm mt-2">{score.description}</p>

      {(score as ClinicalScore).recommendation && (
        <div className="mt-3 p-2 bg-[rgba(26,27,32,1)] rounded-lg">
          <p className="text-yellow-400 text-xs font-medium">Action Required:</p>
          <p className="text-[rgba(217,217,217,1)] text-xs mt-1">{(score as ClinicalScore).recommendation}</p>
        </div>
      )}

      {lastUpdate && (
        <p className="text-[rgba(128,128,128,1)] text-xs mt-2">Updated: {lastUpdate}</p>
      )}
    </div>
  );
};

interface RiskTrajectoryChartProps {
  trajectory: RiskTrajectory[];
}

const RiskTrajectoryChart: React.FC<RiskTrajectoryChartProps> = ({ trajectory }) => {
  if (trajectory.length === 0) {
    return (
      <div className="bg-black border border-[rgba(64,66,73,1)] rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Risk Trajectory</h3>
        <p className="text-[rgba(217,217,217,1)]">Insufficient data for trajectory analysis</p>
      </div>
    );
  }

  const maxRisk = Math.max(...trajectory.map(t => t.combinedRisk));
  const timeLabels = ['6h', '5h', '4h', '3h', '2h', '1h', '30m', 'Now'];
  const recentTrajectory = trajectory.slice(-8);

  return (
    <div className="bg-black border border-[rgba(64,66,73,1)] rounded-2xl p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Risk Trajectory</h3>

      <div className="relative h-48">
        {/* Risk zones */}
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 bg-red-900/20 border-b border-red-500/30"></div>
          <div className="flex-1 bg-yellow-900/20 border-b border-yellow-500/30"></div>
          <div className="flex-1 bg-green-900/20"></div>
        </div>

        {/* Chart */}
        <div className="relative h-full flex items-end justify-between px-2">
          {recentTrajectory.map((point, index) => {
            const height = (point.combinedRisk / (maxRisk || 10)) * 100;
            const color = point.trend === 'critical' ? 'bg-red-500' :
                         point.trend === 'deteriorating' ? 'bg-yellow-500' :
                         point.trend === 'improving' ? 'bg-green-500' : 'bg-blue-500';

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full mx-0.5 ${color} rounded-t transition-all duration-300`}
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-[rgba(128,128,128,1)] text-xs mt-2">
                  {timeLabels[index] || `${index}h`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-[rgba(128,128,128,1)]">
          <span>High</span>
          <span>Med</span>
          <span>Low</span>
        </div>
      </div>

      <div className="flex justify-between mt-4 text-sm">
        <span className="text-[rgba(217,217,217,1)]">
          Current Trend:
          <span className={`ml-2 font-semibold ${
            recentTrajectory[recentTrajectory.length - 1]?.trend === 'critical' ? 'text-red-400' :
            recentTrajectory[recentTrajectory.length - 1]?.trend === 'deteriorating' ? 'text-yellow-400' :
            recentTrajectory[recentTrajectory.length - 1]?.trend === 'improving' ? 'text-green-400' :
            'text-blue-400'
          }`}>
            {recentTrajectory[recentTrajectory.length - 1]?.trend || 'stable'}
          </span>
        </span>
      </div>
    </div>
  );
};

export const ClinicalRiskDashboard: React.FC = () => {
  const { getLatestVitals, getFilteredData, loading } = useVitals('bed_15');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { scores, trajectory, timeToEvent, historicalVitals } = useMemo(() => {
    const latestVitals = getLatestVitals();
    if (!latestVitals) {
      return { scores: null, trajectory: [], timeToEvent: null, historicalVitals: [] };
    }

    // Get historical data for trajectory
    const filteredData = getFilteredData('6h');
    const historicalVitals = filteredData.map(d => d.vital);

    // Convert to API format for trajectory calculation
    const apiFormatVitals = filteredData.map(d => ({
      time: d.timestamp,
      Pulse: d.vital.hr,
      BloodPressure: {
        Systolic: d.vital.bps,
        Diastolic: d.vital.bpd,
        Mean: Math.round((d.vital.bps + 2 * d.vital.bpd) / 3)
      },
      RespirationRate: d.vital.rr,
      SpO2: d.vital.spo2,
      Temp: d.vital.temp
    }));

    // Calculate all scores
    const news2 = calculateNEWS2(latestVitals);
    const msi = calculateModifiedShockIndex(latestVitals);
    const respiratory = calculateRespiratoryIndex(latestVitals);
    const shockIndex = calculateShockIndex(latestVitals.hr, latestVitals.bps);
    const qsofa = calculateqSOFA(latestVitals);
    const map = calculateMAP(latestVitals.bps, latestVitals.bpd);
    const pulsePressure = calculatePulsePressure(latestVitals.bps, latestVitals.bpd);
    const instability = calculateSystemInstability(latestVitals, historicalVitals);

    // Calculate trajectory
    const trajectory = calculateRiskTrajectory(apiFormatVitals);
    const timeToEvent = estimateTimeToEvent(trajectory);

    return {
      scores: {
        news2,
        msi,
        respiratory,
        shockIndex,
        qsofa,
        map,
        pulsePressure,
        instability
      },
      trajectory,
      timeToEvent,
      historicalVitals
    };
  }, [getLatestVitals, getFilteredData]);

  if (loading || !scores) {
    return (
      <section className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-3xl p-6 mt-6">
        <div className="text-white text-xl font-medium">Loading clinical risk assessment...</div>
      </section>
    );
  }

  // Determine if any scores are critical
  const hasCritical = Object.values(scores).some(s =>
    s.risk === 'critical' || s.risk === 'high'
  );

  return (
    <section className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-3xl p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-white text-xl font-bold">Clinical Risk Assessment</h2>
          <p className="text-[rgba(217,217,217,1)] text-sm mt-1">
            Real-time clinical scoring and deterioration detection
          </p>
        </div>
        <div className="text-right">
          <p className="text-[rgba(217,217,217,1)] text-sm">Last Updated</p>
          <p className="text-white font-medium">{currentTime.toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {hasCritical && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 mb-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
            <div>
              <p className="text-red-400 font-bold text-lg">CRITICAL RISK DETECTED</p>
              <p className="text-[rgba(217,217,217,1)] text-sm">Immediate clinical review required</p>
            </div>
          </div>
          {timeToEvent && (
            <p className="text-yellow-400 text-sm mt-2">
              Estimated time to critical event: {timeToEvent.hours} hours
              (Confidence: {timeToEvent.confidence})
            </p>
          )}
        </div>
      )}

      {/* Primary Clinical Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ScoreCard
          title="NEWS2 Score"
          score={scores.news2}
          subtitle="National Early Warning Score"
          critical={scores.news2.risk === 'critical'}
          lastUpdate={currentTime.toLocaleTimeString()}
        />
        <ScoreCard
          title="Modified Shock Index"
          score={scores.msi}
          subtitle="ICU-adjusted shock detection"
          critical={scores.msi.risk === 'critical'}
          lastUpdate={currentTime.toLocaleTimeString()}
        />
        <ScoreCard
          title="Respiratory Risk"
          score={scores.respiratory}
          subtitle="Respiratory failure prediction"
          critical={scores.respiratory.risk === 'critical'}
          lastUpdate={currentTime.toLocaleTimeString()}
        />
        <ScoreCard
          title="System Instability"
          score={scores.instability}
          subtitle="Multi-parameter variance"
          critical={scores.instability.risk === 'critical'}
          lastUpdate={currentTime.toLocaleTimeString()}
        />
      </div>

      {/* Risk Trajectory Visualization */}
      <div className="mb-6">
        <RiskTrajectoryChart trajectory={trajectory} />
      </div>

      {/* Secondary Scores Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[rgba(217,217,217,1)] text-sm">Shock Index</span>
            <div className={`w-2 h-2 rounded-full ${
              scores.shockIndex.risk === 'critical' ? 'bg-red-500' :
              scores.shockIndex.risk === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
          </div>
          <p className="text-white text-xl font-bold">{scores.shockIndex.value}</p>
          <p className="text-[rgba(128,128,128,1)] text-xs mt-1">Normal: 0.5-0.7</p>
        </div>

        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[rgba(217,217,217,1)] text-sm">qSOFA</span>
            <div className={`w-2 h-2 rounded-full ${
              scores.qsofa.risk === 'critical' ? 'bg-red-500' :
              scores.qsofa.risk === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
          </div>
          <p className="text-white text-xl font-bold">{scores.qsofa.value}</p>
          <p className="text-[rgba(128,128,128,1)] text-xs mt-1">Sepsis screening</p>
        </div>

        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[rgba(217,217,217,1)] text-sm">MAP</span>
            <div className={`w-2 h-2 rounded-full ${
              scores.map.risk === 'critical' ? 'bg-red-500' :
              scores.map.risk === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
          </div>
          <p className="text-white text-xl font-bold">{scores.map.value}</p>
          <p className="text-[rgba(128,128,128,1)] text-xs mt-1">Perfusion pressure</p>
        </div>

        <div className="bg-black border border-[rgba(64,66,73,1)] rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[rgba(217,217,217,1)] text-sm">Pulse Pressure</span>
            <div className={`w-2 h-2 rounded-full ${
              scores.pulsePressure.risk === 'critical' ? 'bg-red-500' :
              scores.pulsePressure.risk === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
          </div>
          <p className="text-white text-xl font-bold">{scores.pulsePressure.value}</p>
          <p className="text-[rgba(128,128,128,1)] text-xs mt-1">Volume status</p>
        </div>
      </div>

      {/* Clinical Decision Support */}
      <div className="bg-black border border-[rgba(64,66,73,1)] rounded-2xl p-4">
        <h3 className="text-white font-semibold text-base mb-3">Clinical Decision Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Critical Alerts */}
          <div>
            <p className="text-red-400 font-medium text-sm mb-2">Critical Priorities</p>
            {Object.entries(scores)
              .filter(([_, score]) => score.risk === 'critical' || score.risk === 'high')
              .map(([key, score]) => (
                <div key={key} className="mb-1">
                  <p className="text-[rgba(217,217,217,1)] text-xs">
                    • {key.toUpperCase()}: {(score as ClinicalScore).recommendation || score.description}
                  </p>
                </div>
              ))}
            {Object.values(scores).every(s => s.risk !== 'critical' && s.risk !== 'high') && (
              <p className="text-[rgba(128,128,128,1)] text-xs">No critical alerts</p>
            )}
          </div>

          {/* Warning Alerts */}
          <div>
            <p className="text-yellow-400 font-medium text-sm mb-2">Monitoring Required</p>
            {Object.entries(scores)
              .filter(([_, score]) => score.risk === 'warning' || score.risk === 'medium')
              .map(([key, score]) => (
                <div key={key} className="mb-1">
                  <p className="text-[rgba(217,217,217,1)] text-xs">
                    • {key.toUpperCase()}: {score.description}
                  </p>
                </div>
              ))}
            {Object.values(scores).every(s => s.risk !== 'warning' && s.risk !== 'medium') && (
              <p className="text-[rgba(128,128,128,1)] text-xs">No warnings active</p>
            )}
          </div>

          {/* Time Analysis */}
          <div>
            <p className="text-blue-400 font-medium text-sm mb-2">Temporal Analysis</p>
            {timeToEvent ? (
              <div>
                <p className="text-[rgba(217,217,217,1)] text-xs">
                  • Time to critical: {timeToEvent.hours}h ({timeToEvent.confidence} confidence)
                </p>
              </div>
            ) : (
              <p className="text-[rgba(128,128,128,1)] text-xs">• Patient stable or improving</p>
            )}
            <p className="text-[rgba(217,217,217,1)] text-xs mt-1">
              • Data points analyzed: {historicalVitals.length}
            </p>
            <p className="text-[rgba(217,217,217,1)] text-xs">
              • Monitoring duration: 6 hours
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};