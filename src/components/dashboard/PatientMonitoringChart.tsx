import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useVitals } from '@/hooks/useVitals';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';
type TimeRange = '1h' | '4h' | '12h' | '24h' | '1w';

interface PatientMonitoringChartProps {
  selectedMetrics: MetricType[];
}

export const PatientMonitoringChart: React.FC<PatientMonitoringChartProps> = ({ selectedMetrics }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const { getFilteredData, loading } = useVitals('bed_15');

  const chartData = useMemo(() => {
    const data = getFilteredData(timeRange);
    return data.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      heartRate: item.vital.hr,
      bloodPressure: item.vital.bps,
      temperature: item.vital.temp,
      spo2: item.vital.spo2,
      respiratoryRate: item.vital.rr
    }));
  }, [getFilteredData, timeRange]);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="w-full mt-6 bg-black rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl">Vital Signs</h3>
        <div className="flex gap-2">
          {['1h', '4h', '12h', '24h', '1w'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as TimeRange)}
              className={`w-12 h-12 rounded-full text-sm ${
                timeRange === range ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis domain={[0, 200]} />
            
            {selectedMetrics.includes('heartRate') && (
              <Area type="monotone" dataKey="heartRate" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            )}
            {selectedMetrics.includes('bloodPressure') && (
              <Area type="monotone" dataKey="bloodPressure" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
            )}
            {selectedMetrics.includes('temperature') && (
              <Area type="monotone" dataKey="temperature" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            )}
            {selectedMetrics.includes('spo2') && (
              <Area type="monotone" dataKey="spo2" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            )}
            {selectedMetrics.includes('respiratoryRate') && (
              <Area type="monotone" dataKey="respiratoryRate" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};