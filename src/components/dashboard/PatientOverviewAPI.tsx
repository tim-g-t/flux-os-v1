import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApiService } from '@/services/patientApiService';
import { calculateRiskScores } from '@/utils/riskCalculations';
import { APIPatient, APIVitalReading } from '@/types/patient';
import { VitalReading } from '@/services/vitalsService';
import { MiniChart } from './MiniChart';
import { Header } from './Header';

// Generate time series data for mini charts from API vitals
const generateChartDataFromVitals = (vitals: APIVitalReading[], vitalType: string) => {
  // Get last 12 hours of data
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const recentVitals = vitals.filter(v => new Date(v.time) >= twelveHoursAgo);

  // Sample data if too many points (max 50 points for performance)
  const sampledVitals = recentVitals.length > 50
    ? recentVitals.filter((_, index) => index % Math.ceil(recentVitals.length / 50) === 0)
    : recentVitals;

  return sampledVitals.map(vital => {
    const time = new Date(vital.time);
    let value = 0;

    switch (vitalType) {
      case 'hr': value = vital.Pulse; break;
      case 'bps': value = vital.BloodPressure.Systolic; break;
      case 'bpd': value = vital.BloodPressure.Diastolic; break;
      case 'spo2': value = vital.SpO2; break;
      case 'temp': value = vital.Temp; break;
      case 'rr': value = vital.RespirationRate; break;
    }

    return {
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(value * 10) / 10
    };
  });
};

interface PatientOverviewAPIProps {
  onPatientSelect?: (patientId: string) => void;
}

export const PatientOverviewAPI: React.FC<PatientOverviewAPIProps> = ({ onPatientSelect }) => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<APIPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVitals, setSelectedVitals] = useState<Record<string, string>>({});
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const loadPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        // Start progress animation (simulated based on expected 35s load time)
        let progress = 0;
        progressInterval = setInterval(() => {
          progress += 100 / 40; // 100% over 40 seconds (slightly slower than expected 30s)
          setLoadingProgress(Math.min(progress, 90)); // Cap at 90% until actual completion
        }, 1000);

        const data = await patientApiService.fetchPatients();
        setPatients(data);

        // Initialize selected vitals for each patient
        const initialSelection: Record<string, string> = {};
        data.forEach(patient => {
          const bedId = `bed_${patient.Identifier.toString().padStart(2, '0')}`;
          initialSelection[bedId] = 'hr';
        });
        setSelectedVitals(initialSelection);

        setLoadingProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient data');
        console.error('Error loading patients:', err);
      } finally {
        setLoading(false);
        if (progressInterval) clearInterval(progressInterval);
      }
    };

    loadPatients();

    // Subscribe to updates
    const unsubscribe = patientApiService.subscribe((updatedPatients) => {
      setPatients(updatedPatients);
    });

    return () => {
      unsubscribe();
      if (progressInterval) clearInterval(progressInterval);
    };
  }, []);

  const vitalOptions = [
    { key: 'hr', label: 'HR', unit: 'bpm', color: '#3b82f6' },
    { key: 'bps', label: 'SYS', unit: 'mmHg', color: '#ef4444' },
    { key: 'bpd', label: 'DIA', unit: 'mmHg', color: '#f59e0b' },
    { key: 'spo2', label: 'SpO2', unit: '%', color: '#10b981' },
    { key: 'temp', label: 'Temp', unit: '°F', color: '#8b5cf6' },
    { key: 'rr', label: 'RR', unit: 'bpm', color: '#06b6d4' }
  ];

  const getVitalValue = (vital: APIVitalReading, key: string): number => {
    switch (key) {
      case 'hr': return vital.Pulse;
      case 'bps': return vital.BloodPressure.Systolic;
      case 'bpd': return vital.BloodPressure.Diastolic;
      case 'spo2': return vital.SpO2;
      case 'temp': return Number(vital.Temp.toFixed(1));
      case 'rr': return vital.RespirationRate;
      default: return 0;
    }
  };

  const getVitalRisk = (vital: APIVitalReading, vitalType: string): 'normal' | 'warning' | 'critical' => {
    switch (vitalType) {
      case 'hr':
        if (vital.Pulse < 50 || vital.Pulse > 140) return 'critical';
        if (vital.Pulse < 60 || vital.Pulse > 120) return 'warning';
        return 'normal';
      case 'bp':
        if (vital.BloodPressure.Systolic < 70 || vital.BloodPressure.Systolic > 180) return 'critical';
        if (vital.BloodPressure.Systolic < 80 || vital.BloodPressure.Systolic > 160) return 'warning';
        return 'normal';
      case 'spo2':
        if (vital.SpO2 < 85) return 'critical';
        if (vital.SpO2 < 90) return 'warning';
        return 'normal';
      case 'temp':
        if (vital.Temp < 95.0 || vital.Temp > 102.0) return 'critical';
        if (vital.Temp < 96.0 || vital.Temp > 101.0) return 'warning';
        return 'normal';
      case 'rr':
        if (vital.RespirationRate < 8 || vital.RespirationRate > 30) return 'critical';
        if (vital.RespirationRate < 10 || vital.RespirationRate > 25) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getCriticalRiskScores = (vital: VitalReading): Array<{name: string, value: string, description: string}> => {
    const riskScores = calculateRiskScores(vital);
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
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-white text-2xl font-bold mb-4 text-center">Loading Patient Data</h2>
            <p className="text-[rgba(217,217,217,1)] text-sm mb-2 text-center">
              Loading 85MB+ dataset from API server
            </p>
            <p className="text-[rgba(217,217,217,1)] text-xs mb-6 text-center text-yellow-400">
              This will take approximately 30-40 seconds - please be patient
            </p>
            <div className="w-full bg-[rgba(64,66,73,1)] rounded-full h-3 mb-4">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-[rgba(217,217,217,1)] text-sm text-center mb-2">
              {Math.round(loadingProgress)}% - Fetching data...
            </p>
            <p className="text-[rgba(128,128,128,1)] text-xs text-center">
              {loadingProgress < 25 ? 'Connecting to server...' :
               loadingProgress < 50 ? 'Downloading patient records...' :
               loadingProgress < 75 ? 'Processing vital signs data...' :
               'Almost complete...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="bg-[rgba(26,27,32,1)] border border-red-500 rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-red-400 text-2xl font-bold mb-4">Error Loading Data</h2>
            <p className="text-[rgba(217,217,217,1)] mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="pt-6 px-6 mt-8">
        <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-3xl pt-6 px-6 pb-8">
          <div className="mb-4 text-white">
            <h2 className="text-2xl font-bold">Patient Overview - Live Data</h2>
            <p className="text-[rgba(217,217,217,1)] text-sm mt-1">
              Showing {patients.length} patients with real-time vital signs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {patients.slice(0, 12).map(patient => {
              const bedId = `bed_${patient.Identifier.toString().padStart(2, '0')}`;
              const latestVital = patient.Vitals[patient.Vitals.length - 1];

              if (!latestVital) return null;

              const transformedVital = patientApiService.transformVitalReading(latestVital);
              const riskScores = calculateRiskScores(transformedVital);
              const selectedVital = selectedVitals[bedId] || 'hr';
              const vitalOption = vitalOptions.find(opt => opt.key === selectedVital) || vitalOptions[0];
              const criticalRiskScores = getCriticalRiskScores(transformedVital);

              const patientRiskCounts = Object.values(riskScores).reduce((acc, score) => {
                acc[score.risk] = (acc[score.risk] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const criticalCount = patientRiskCounts.critical || 0;
              const warningCount = patientRiskCounts.warning || 0;
              const overallStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'normal';

              const meanBP = latestVital.BloodPressure.Mean;

              const chartData = generateChartDataFromVitals(patient.Vitals, selectedVital);
              const latestValue = getVitalValue(latestVital, selectedVital);

              return (
                <div
                  key={bedId}
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
                      onPatientSelect(bedId);
                    }
                    navigate(`/patient/${bedId}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-white text-xl font-bold">{patient.Name}</div>
                      <div className="text-[rgba(217,217,217,1)] text-base">
                        {patient.Bed} • {patient.Age}y {patient.Gender}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full ${
                      overallStatus === 'critical' ? 'bg-red-500' :
                      overallStatus === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {vitalOptions.map(option => (
                        <button
                          key={option.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVitals(prev => ({ ...prev, [bedId]: option.key }));
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

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[rgba(217,217,217,1)] text-sm">{vitalOption.label} - Last 12h</div>
                      <div className="text-right">
                        <span className="text-white font-bold text-lg">{latestValue}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">{vitalOption.unit}</span>
                      </div>
                    </div>
                    <MiniChart
                      data={chartData}
                      color={vitalOption.color}
                      selectedVital={selectedVital}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Heart Rate</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(latestVital, 'hr') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(latestVital, 'hr') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(latestVital, 'hr') === 'critical' ? 'text-red-400' :
                          getVitalRisk(latestVital, 'hr') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{latestVital.Pulse}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">bpm</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Blood Pressure</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(latestVital, 'bp') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(latestVital, 'bp') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(latestVital, 'bp') === 'critical' ? 'text-red-400' :
                          getVitalRisk(latestVital, 'bp') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{latestVital.BloodPressure.Systolic}/{latestVital.BloodPressure.Diastolic}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">mmHg</span>
                        <div className="text-[rgba(128,128,128,1)] text-xs">Mean: {meanBP} mmHg</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">SpO2</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(latestVital, 'spo2') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(latestVital, 'spo2') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(latestVital, 'spo2') === 'critical' ? 'text-red-400' :
                          getVitalRisk(latestVital, 'spo2') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{latestVital.SpO2}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Temperature</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(latestVital, 'temp') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(latestVital, 'temp') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(latestVital, 'temp') === 'critical' ? 'text-red-400' :
                          getVitalRisk(latestVital, 'temp') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{latestVital.Temp.toFixed(1)}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">°F</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[rgba(217,217,217,1)] text-base">Respiratory Rate</span>
                      <div className={`text-right px-2 py-1 rounded ${
                        getVitalRisk(latestVital, 'rr') === 'critical' ? 'bg-red-900/30 border border-red-500/50' :
                        getVitalRisk(latestVital, 'rr') === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/50' :
                        ''
                      }`}>
                        <span className={`font-bold text-lg ${
                          getVitalRisk(latestVital, 'rr') === 'critical' ? 'text-red-400' :
                          getVitalRisk(latestVital, 'rr') === 'warning' ? 'text-yellow-400' :
                          'text-white'
                        }`}>{latestVital.RespirationRate}</span>
                        <span className="text-[rgba(128,128,128,1)] text-sm ml-1">bpm</span>
                      </div>
                    </div>
                  </div>

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