import React, { useState, useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useVitals } from '@/hooks/useVitals';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';
type TimeRange = '1h' | '4h' | '12h' | '24h' | '1w';

interface PatientMonitoringChartProps {
  selectedMetrics: MetricType[];
}

export const PatientMonitoringChart: React.FC<PatientMonitoringChartProps> = ({ selectedMetrics }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const { getFilteredData, loading } = useVitals('bed_15');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const metricNames = {
              heartRate: 'Heart Rate',
              bloodPressureSystolic: 'Systolic BP',
              bloodPressureDiastolic: 'Diastolic BP',
              bloodPressureMean: 'Mean BP',
              temperature: 'Temperature',
              spo2: 'SpO2',
              respiratoryRate: 'Respiratory Rate'
            };
            const units = {
              heartRate: 'bpm',
              bloodPressureSystolic: 'mmHg',
              bloodPressureDiastolic: 'mmHg',
              bloodPressureMean: 'mmHg',
              temperature: '°C',
              spo2: '%',
              respiratoryRate: 'rpm'
            };
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${metricNames[entry.dataKey as keyof typeof metricNames]}: ${entry.value} ${units[entry.dataKey as keyof typeof units]}`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const chartData = useMemo(() => {
    const data = getFilteredData(timeRange);
    return data.map((item) => {
      const date = new Date(item.timestamp);
      let timeLabel;
      
      switch (timeRange) {
        case '1h':
        case '4h':
          timeLabel = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          break;
        case '12h':
        case '24h':
          timeLabel = date.toLocaleTimeString('en-US', { 
            hour: '2-digit',
            hour12: false 
          });
          break;
        case '1w':
          timeLabel = date.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
          });
          break;
        default:
          timeLabel = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
      }
      
      return {
        time: timeLabel,
        heartRate: item.vital.hr,
        bloodPressureSystolic: item.vital.bps,
        bloodPressureDiastolic: item.vital.bpd,
        bloodPressureMean: Math.round((item.vital.bps + 2 * item.vital.bpd) / 3),
        temperature: item.vital.temp,
        spo2: item.vital.spo2,
        respiratoryRate: item.vital.rr
      };
    });
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
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip content={<CustomTooltip />} />
            
            {selectedMetrics.includes('heartRate') && (
              <Area type="monotone" dataKey="heartRate" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            )}
            {selectedMetrics.includes('bloodPressure') && (
              <>
                <Line type="monotone" dataKey="bloodPressureSystolic" stroke="#EF4444" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="bloodPressureDiastolic" stroke="#F97316" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="bloodPressureMean" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="8,4" dot={false} />
              </>
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};