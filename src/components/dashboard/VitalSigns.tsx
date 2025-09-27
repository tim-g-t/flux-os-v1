import React, { useMemo } from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { useVitals } from '@/hooks/useVitals';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';

interface VitalSignsProps {
  selectedMetrics: MetricType[];
  onMetricToggle: (metric: MetricType) => void;
}

export const VitalSigns: React.FC<VitalSignsProps> = ({ selectedMetrics, onMetricToggle }) => {
  const { getLatestVitals, loading } = useVitals('bed_15');
  
  const latestVitals = useMemo(() => getLatestVitals(), [getLatestVitals]);
  
  if (loading || !latestVitals) {
    return (
      <section className="w-[78%] ml-5 max-md:w-full max-md:ml-0">
        <div className="bg-black w-full mx-auto px-8 py-5 rounded-3xl max-md:max-w-full max-md:mt-10 max-md:px-5">
          <div className="text-white text-xl font-medium">Loading vital signs...</div>
        </div>
      </section>
    );
  }
  
  // Calculate changes (using simple random values for demo - in production, compare with previous reading)
  const getRandomChange = () => {
    const isPositive = Math.random() > 0.5;
    const change = (Math.random() * 5).toFixed(2);
    const percent = (Math.random() * 2).toFixed(1);
    return {
      value: `${isPositive ? '+' : '-'}${change} (${percent}%)`,
      type: isPositive ? 'positive' : 'negative'
    };
  };

  const hrChange = getRandomChange();
  const bpChange = getRandomChange();
  const spo2Change = getRandomChange();
  const tempChange = getRandomChange();
  const rrChange = getRandomChange();
  
  return (
    <section className="w-[78%] ml-5 max-md:w-full max-md:ml-0">
      <div className="bg-black w-full mx-auto px-8 py-5 rounded-3xl max-md:max-w-full max-md:mt-10 max-md:px-5">
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
            value={latestVitals.hr.toString()}
            change={hrChange.value}
            changeType={hrChange.type as 'positive' | 'negative'}
            label="Pulse"
            className="pl-4 pr-[34px]"
            onClick={() => onMetricToggle('heartRate')}
            isSelected={selectedMetrics.includes('heartRate')}
          />
          <MetricCard
            value={`${latestVitals.bpd}/${latestVitals.bps}`}
            change={bpChange.value}
            changeType={bpChange.type as 'positive' | 'negative'}
            label="Blood Pressure"
            onClick={() => onMetricToggle('bloodPressure')}
            isSelected={selectedMetrics.includes('bloodPressure')}
          />
          <MetricCard
            value={latestVitals.spo2.toString()}
            change={spo2Change.value}
            changeType={spo2Change.type as 'positive' | 'negative'}
            label="SpO2"
            className="pl-4 pr-[34px]"
            onClick={() => onMetricToggle('spo2')}
            isSelected={selectedMetrics.includes('spo2')}
          />
          <MetricCard
            value={latestVitals.temp.toString()}
            change={tempChange.value}
            changeType={tempChange.type as 'positive' | 'negative'}
            label="Temp"
            className="pl-[15px] pr-[34px]"
            onClick={() => onMetricToggle('temperature')}
            isSelected={selectedMetrics.includes('temperature')}
          />
          <MetricCard
            value={latestVitals.rr.toString()}
            change={rrChange.value}
            changeType={rrChange.type as 'positive' | 'negative'}
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
