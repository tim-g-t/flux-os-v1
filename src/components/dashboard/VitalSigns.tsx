import React, { useMemo } from 'react';
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

  const latestVitals = useMemo(() => getLatestVitals(), [getLatestVitals]);
  const historicalData = useMemo(() => getFilteredData('24h'), [getFilteredData]);
  
  if (loading || !latestVitals) {
    return (
      <section className="w-[82%] ml-5 max-md:w-full max-md:ml-0">
        <div className="bg-black w-full mx-auto px-8 py-5 rounded-3xl max-md:max-w-full max-md:mt-10 max-md:px-5">
          <div className="text-white text-xl font-medium">Loading vital signs...</div>
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
    <section className="w-[82%] ml-5 max-md:w-full max-md:ml-0">
      <div className="bg-black border border-[rgba(64,66,73,1)] w-full mx-auto px-8 py-5 rounded-[32px] max-md:max-w-full max-md:mt-10 max-md:px-5">
        <div className="flex w-full items-stretch gap-[40px_100px] flex-wrap max-md:max-w-full">
          <h2 className="text-white text-xl font-medium my-auto">
            Current Vital Signs
          </h2>
          <div className="flex flex-1 justify-end">
            <button className="border flex items-center gap-2.5 text-base text-white font-normal justify-center px-[26px] py-[18px] rounded-[32px] border-white border-solid max-md:px-5 hover:bg-white hover:text-black transition-colors">
              <div className="self-stretch my-auto">
                See all
              </div>
            </button>
            <button className="border flex gap-2.5 p-[13px] rounded-[50px] border-white border-solid hover:bg-white hover:border-gray-300 transition-colors">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/7e63f46350fe5103317be6aea16e4200977ace33?placeholderIfAbsent=true"
                alt="Export data"
                className="aspect-[1] object-contain w-[30px]"
              />
            </button>
          </div>
        </div>
        <div className="flex items-stretch gap-[21px] flex-wrap mt-4 max-md:max-w-full">
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
            className="pl-4 pr-[34px]"
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
            className="pl-4 pr-[34px]"
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
            className="pl-[15px] pr-[34px]"
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
            className="pl-4 pr-[34px]"
            onClick={() => onMetricToggle('respiratoryRate')}
            isSelected={selectedMetrics.includes('respiratoryRate')}
          />
        </div>
      </div>
    </section>
  );
};
