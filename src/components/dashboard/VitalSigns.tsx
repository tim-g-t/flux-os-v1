import React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { useVitals } from '@/hooks/useVitals';
import { calculateVitalChange } from '@/utils/riskCalculations';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';

interface VitalSignsProps {
  selectedMetrics: MetricType[];
  onMetricToggle: (metric: MetricType) => void;
  patientId?: string;
}

export const VitalSigns: React.FC<VitalSignsProps> = ({ selectedMetrics, onMetricToggle, patientId = 'bed_01' }) => {
  const { getLatestVitals, getFilteredData, loading } = useVitals(patientId);

  // No useMemo to ensure updates are reflected immediately
  const latestVitals = getLatestVitals();
  const historicalData = getFilteredData('24h');
  
  if (loading || !latestVitals) {
    return (
      <section className="flex-1 xl:ml-5 max-xl:mt-4">
        <div className="bg-black w-full px-4 lg:px-8 py-4 lg:py-5 rounded-2xl lg:rounded-3xl">
          <div className="text-white text-lg lg:text-xl font-medium">Loading vital signs...</div>
        </div>
      </section>
    );
  }
  
  // Extract historical values for each vital sign
  const hrValues = historicalData.map(d => d.vital.hr);
  const bpsValues = historicalData.map(d => d.vital.bps);
  const bpdValues = historicalData.map(d => d.vital.bpd);
  const spo2Values = historicalData.map(d => d.vital.spo2);
  const tempValues = historicalData.map(d => d.vital.temp);
  const rrValues = historicalData.map(d => d.vital.rr);
  
  // Calculate changes for each vital sign
  const hrChangeData = calculateVitalChange(latestVitals.hr, hrValues);
  const bpsChangeData = calculateVitalChange(latestVitals.bps, bpsValues);
  const bpdChangeData = calculateVitalChange(latestVitals.bpd, bpdValues);
  const spo2ChangeData = calculateVitalChange(latestVitals.spo2, spo2Values);
  const tempChangeData = calculateVitalChange(latestVitals.temp, tempValues);
  const rrChangeData = calculateVitalChange(latestVitals.rr, rrValues);
  
  // Format change values for display with units
  const formatChange = (changeData: typeof hrChangeData, unit: string) => {
    const sign = changeData.absoluteChange >= 0 ? '+' : '';
    return `${sign}${changeData.absoluteChange.toFixed(1)} ${unit}`;
  };
  
  const hrChange = {
    value: formatChange(hrChangeData, 'bpm'),
    type: hrChangeData.absoluteChange >= 0 ? 'positive' : 'negative',
    trendIndicator: hrChangeData.trendIndicator
  };
  
  const bpChange = {
    value: formatChange(bpsChangeData, 'mmHg'),
    type: bpsChangeData.absoluteChange >= 0 ? 'positive' : 'negative',
    trendIndicator: bpsChangeData.trendIndicator
  };
  
  const spo2Change = {
    value: formatChange(spo2ChangeData, '%'),
    type: spo2ChangeData.absoluteChange >= 0 ? 'positive' : 'negative',
    trendIndicator: spo2ChangeData.trendIndicator
  };
  
  const tempChange = {
    value: formatChange(tempChangeData, '°F'),
    type: tempChangeData.absoluteChange >= 0 ? 'positive' : 'negative',
    trendIndicator: tempChangeData.trendIndicator
  };
  
  const rrChange = {
    value: formatChange(rrChangeData, 'bpm'),
    type: rrChangeData.absoluteChange >= 0 ? 'positive' : 'negative',
    trendIndicator: rrChangeData.trendIndicator
  };
  
  return (
    <section className="flex-1 xl:ml-5 max-xl:mt-4">
      <div className="bg-black border border-[rgba(64,66,73,1)] w-full px-4 lg:px-8 py-4 lg:py-5 rounded-2xl lg:rounded-[32px]">
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <h2 className="text-white text-lg lg:text-xl font-medium">
            Current Vital Signs
          </h2>
          <div className="flex gap-2">
            <button className="border flex items-center gap-2 text-sm lg:text-base text-white font-normal justify-center px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-3xl border-white border-solid hover:bg-white hover:text-black transition-colors">
              <span>See all</span>
            </button>
            <button className="border flex p-2.5 lg:p-3 rounded-full border-white border-solid hover:bg-white hover:border-gray-300 transition-colors">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/7e63f46350fe5103317be6aea16e4200977ace33?placeholderIfAbsent=true"
                alt="Export data"
                className="aspect-square object-contain w-5 lg:w-7"
              />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4 mt-4">
          <MetricCard
            value={
              <span>
                {latestVitals.hr}
                <span className="text-gray-500 text-[0.5em] ml-1">bpm</span>
              </span>
            }
            change={hrChange.value}
            changeType={hrChange.type as 'positive' | 'negative'}
            trendIndicator={hrChange.trendIndicator}
            label="Heart Rate"
            onClick={() => onMetricToggle('heartRate')}
            isSelected={selectedMetrics.includes('heartRate')}
          />
          <MetricCard
            value={
              <span>
                {latestVitals.bpd}/{latestVitals.bps}
                <span className="text-gray-500 text-[0.5em] ml-1">mmHg</span>
              </span>
            }
            change={bpChange.value}
            changeType={bpChange.type as 'positive' | 'negative'}
            trendIndicator={bpChange.trendIndicator}
            label="Blood Pressure"
            onClick={() => onMetricToggle('bloodPressure')}
            isSelected={selectedMetrics.includes('bloodPressure')}
          />
          <MetricCard
            value={
              <span>
                {latestVitals.spo2}
                <span className="text-gray-500 text-[0.5em] ml-1">%</span>
              </span>
            }
            change={spo2Change.value}
            changeType={spo2Change.type as 'positive' | 'negative'}
            trendIndicator={spo2Change.trendIndicator}
            label="SpO2"
            onClick={() => onMetricToggle('spo2')}
            isSelected={selectedMetrics.includes('spo2')}
          />
          <MetricCard
            value={
              <span>
                {latestVitals.temp}
                <span className="text-gray-500 text-[0.5em] ml-1">°F</span>
              </span>
            }
            change={tempChange.value}
            changeType={tempChange.type as 'positive' | 'negative'}
            trendIndicator={tempChange.trendIndicator}
            label="Temp"
            onClick={() => onMetricToggle('temperature')}
            isSelected={selectedMetrics.includes('temperature')}
          />
          <MetricCard
            value={
              <span>
                {latestVitals.rr}
                <span className="text-gray-500 text-[0.5em] ml-1">bpm</span>
              </span>
            }
            change={rrChange.value}
            changeType={rrChange.type as 'positive' | 'negative'}
            trendIndicator={rrChange.trendIndicator}
            label="Respiratory Rate"
            onClick={() => onMetricToggle('respiratoryRate')}
            isSelected={selectedMetrics.includes('respiratoryRate')}
          />
        </div>
      </div>
    </section>
  );
};
