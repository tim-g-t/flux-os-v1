import React, { useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const chartData = [
  { time: 'Jan 1st', heartRate: 200, bloodPressure: 120, temperature: 98.6, spo2: 98, respiratoryRate: 16 },
  { time: 'Jan 15th', heartRate: 180, bloodPressure: 118, temperature: 98.4, spo2: 97, respiratoryRate: 17 },
  { time: 'Feb 1st', heartRate: 160, bloodPressure: 125, temperature: 98.8, spo2: 98, respiratoryRate: 18 },
  { time: 'Feb 15th', heartRate: 140, bloodPressure: 130, temperature: 99.1, spo2: 96, respiratoryRate: 19 },
  { time: 'Mar 1st', heartRate: 120, bloodPressure: 135, temperature: 99.3, spo2: 95, respiratoryRate: 20 },
  { time: 'Mar 15th', heartRate: 130, bloodPressure: 128, temperature: 98.9, spo2: 97, respiratoryRate: 18 },
  { time: 'Apr 1st', heartRate: 140, bloodPressure: 132, temperature: 99.0, spo2: 96, respiratoryRate: 17 },
  { time: 'Apr 15th', heartRate: 150, bloodPressure: 140, temperature: 99.5, spo2: 94, respiratoryRate: 16 },
  { time: 'May 1st', heartRate: 160, bloodPressure: 140, temperature: 99.5, spo2: 94, respiratoryRate: 15 },
  { time: 'May 15th', heartRate: 140, bloodPressure: 140, temperature: 99.5, spo2: 94, respiratoryRate: 16 },
  { time: 'Jun 1st', heartRate: 100, bloodPressure: 140, temperature: 99.5, spo2: 94, respiratoryRate: 17 },
  { time: 'Jun 15th', heartRate: 80, bloodPressure: 140, temperature: 99.5, spo2: 94, respiratoryRate: 18 },
  { time: 'Jul 1st', heartRate: 70, bloodPressure: 140, temperature: 99.5, spo2: 94, respiratoryRate: 19 },
  { time: 'Jul 15th', heartRate: 50, bloodPressure: 140, temperature: 99.5, spo2: 94, respiratoryRate: 20 },
];

const chartConfig = {
  heartRate: {
    label: 'HR',
    color: '#3B82F6',
  },
  bloodPressure: {
    label: 'BP',
    color: '#EF4444',
  },
  temperature: {
    label: 'Temp',
    color: '#10B981',
  },
  spo2: {
    label: 'SpO2',
    color: '#8B5CF6',
  },
  respiratoryRate: {
    label: 'RR',
    color: '#F59E0B',
  },
};

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';
type TimeRange = '1h' | '4h' | '12h' | '24h' | '1w';

interface PatientMonitoringChartProps {
  selectedMetrics: MetricType[];
}

export const PatientMonitoringChart: React.FC<PatientMonitoringChartProps> = ({ selectedMetrics }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  
  console.log('PatientMonitoringChart - selectedMetrics:', selectedMetrics);


  const metricLabels = {
    heartRate: 'HR',
    bloodPressure: 'BP',
    temperature: 'Temp',
    spo2: 'SpO2'
  };

  const timeRangeLabels = {
    '1h': '1h',
    '4h': '4h', 
    '12h': '12h',
    '24h': '24h',
    '1w': '1w'
  };

  return (
    <div className="w-full max-w-full overflow-hidden mt-6 bg-black rounded-lg p-4">
      {/* Header with title and selectors */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-medium">Vital Signs</h3>
        
        <div className="flex items-center gap-6">
          {/* Time Range Selector - Circular buttons */}
          <div className="flex gap-2">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`w-12 h-12 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ChartContainer config={chartConfig}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorHeartRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorBloodPressure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorTemperature" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorRespiratoryRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(156, 163, 175, 1)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(156, 163, 175, 1)', fontSize: 12 }}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(75, 85, 99, 1)',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            
            {selectedMetrics.includes('heartRate') && (
              <Area
                type="monotone"
                dataKey="heartRate"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorHeartRate)"
              />
            )}
            
            {selectedMetrics.includes('bloodPressure') && (
              <Area
                type="monotone"
                dataKey="bloodPressure"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#colorBloodPressure)"
              />
            )}
            
            {selectedMetrics.includes('temperature') && (
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#colorTemperature)"
              />
            )}
            
            {selectedMetrics.includes('spo2') && (
              <Area
                type="monotone"
                dataKey="spo2"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#colorSpo2)"
              />
            )}
            
            {selectedMetrics.includes('respiratoryRate') && (
              <Area
                type="monotone"
                dataKey="respiratoryRate"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#colorRespiratoryRate)"
              />
            )}
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
};