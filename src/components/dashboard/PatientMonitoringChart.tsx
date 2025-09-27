import React, { useState, useMemo } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useVitals } from '@/hooks/useVitals';

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
  const { getFilteredData, loading } = useVitals('bed_15');

  const chartData = useMemo(() => {
    const data = getFilteredData(timeRange);
    return data.map((item, index) => ({
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      heartRate: item.vital.hr,
      bloodPressure: item.vital.bps, // Using systolic for chart
      temperature: item.vital.temp,
      spo2: item.vital.spo2,
      respiratoryRate: item.vital.rr
    }));
  }, [getFilteredData, timeRange]);

  if (loading) {
    return (
      <div className="w-full max-w-full overflow-hidden mt-6 bg-black rounded-lg p-4">
        <div className="text-white text-xl font-medium">Loading chart data...</div>
      </div>
    );
  }


  const getYAxisDomain = useMemo(() => {
    // Determine appropriate Y-axis range based on selected metrics
    if (selectedMetrics.length === 1) {
      const metric = selectedMetrics[0];
      switch (metric) {
        case 'heartRate':
          return [30, 200];
        case 'bloodPressure':
          return [60, 200];
        case 'temperature':
          return [95, 105];
        case 'spo2':
          return [85, 100];
        case 'respiratoryRate':
          return [8, 40];
        default:
          return [0, 200];
      }
    } else if (selectedMetrics.includes('temperature') && selectedMetrics.length === 2 && selectedMetrics.includes('spo2')) {
      // Special case for temp + SpO2 - both have small ranges
      return [80, 105];
    } else if (selectedMetrics.includes('temperature') || selectedMetrics.includes('spo2')) {
      // If temp or SpO2 mixed with others, use wider range
      return [0, 200];
    } else {
      // Default for HR, BP, RR combinations
      return [0, 200];
    }
  }, [selectedMetrics]);

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
              domain={getYAxisDomain}
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