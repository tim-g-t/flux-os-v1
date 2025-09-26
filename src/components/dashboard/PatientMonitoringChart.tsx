import React, { useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

const chartData = [
  { time: '00:00', heartRate: 72, bloodPressure: 120, temperature: 98.6, spo2: 98 },
  { time: '02:00', heartRate: 68, bloodPressure: 118, temperature: 98.4, spo2: 97 },
  { time: '04:00', heartRate: 75, bloodPressure: 125, temperature: 98.8, spo2: 98 },
  { time: '06:00', heartRate: 80, bloodPressure: 130, temperature: 99.1, spo2: 96 },
  { time: '08:00', heartRate: 85, bloodPressure: 135, temperature: 99.3, spo2: 95 },
  { time: '10:00', heartRate: 78, bloodPressure: 128, temperature: 98.9, spo2: 97 },
  { time: '12:00', heartRate: 82, bloodPressure: 132, temperature: 99.0, spo2: 96 },
  { time: '14:00', heartRate: 88, bloodPressure: 140, temperature: 99.5, spo2: 94 },
];

const chartConfig = {
  heartRate: {
    label: 'Heart Rate',
    color: 'hsl(var(--chart-1))',
  },
  bloodPressure: {
    label: 'Blood Pressure',
    color: 'hsl(var(--chart-2))',
  },
  temperature: {
    label: 'Temperature',
    color: 'hsl(var(--chart-3))',
  },
  spo2: {
    label: 'SpO2',
    color: 'hsl(var(--chart-4))',
  },
};

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2';
type TimeRange = '6h' | '12h' | '24h' | '7d';

export const PatientMonitoringChart: React.FC = () => {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['heartRate', 'bloodPressure']);
  const [timeRange, setTimeRange] = useState<TimeRange>('12h');

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const metricLabels = {
    heartRate: 'Heart Rate',
    bloodPressure: 'Blood Pressure',
    temperature: 'Temperature',
    spo2: 'SpO2'
  };

  const timeRangeLabels = {
    '6h': '6 Hours',
    '12h': '12 Hours', 
    '24h': '24 Hours',
    '7d': '7 Days'
  };

  return (
    <div className="w-full max-w-full overflow-hidden mt-6">
      {/* Header with selector boxes */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4 px-2">
        <h3 className="text-white text-xl font-medium">Patient Monitoring</h3>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Metric Selectors */}
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Metrics:</span>
            <div className="flex gap-2">
              {(Object.keys(metricLabels) as MetricType[]).map((metric) => (
                <button
                  key={metric}
                  onClick={() => toggleMetric(metric)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedMetrics.includes(metric)
                      ? 'bg-[rgba(1,119,251,1)] text-white'
                      : 'bg-[rgba(64,66,73,1)] text-[rgba(203,204,209,1)] hover:bg-[rgba(84,86,93,1)]'
                  }`}
                >
                  {metricLabels[metric]}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Range:</span>
            <div className="flex gap-1">
              {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-[rgba(1,119,251,1)] text-white'
                      : 'bg-[rgba(64,66,73,1)] text-[rgba(203,204,209,1)] hover:bg-[rgba(84,86,93,1)]'
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full px-2">
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(203,204,209,1)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(203,204,209,1)', fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            
            {selectedMetrics.includes('heartRate') && (
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke={chartConfig.heartRate.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.heartRate.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: chartConfig.heartRate.color }}
              />
            )}
            
            {selectedMetrics.includes('bloodPressure') && (
              <Line
                type="monotone"
                dataKey="bloodPressure"
                stroke={chartConfig.bloodPressure.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.bloodPressure.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: chartConfig.bloodPressure.color }}
              />
            )}
            
            {selectedMetrics.includes('temperature') && (
              <Line
                type="monotone"
                dataKey="temperature"
                stroke={chartConfig.temperature.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.temperature.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: chartConfig.temperature.color }}
              />
            )}
            
            {selectedMetrics.includes('spo2') && (
              <Line
                type="monotone"
                dataKey="spo2"
                stroke={chartConfig.spo2.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.spo2.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: chartConfig.spo2.color }}
              />
            )}
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};