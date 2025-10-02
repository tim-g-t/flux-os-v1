import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useVitals } from '@/hooks/useVitals';
import { debounce } from '@/utils/dataDownsampling';

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'spo2' | 'respiratoryRate';
type TimeRange = '1h' | '4h' | '12h' | '24h' | '1w';

interface PatientMonitoringChartProps {
  selectedMetrics: MetricType[];
  patientId?: string;
}

const PatientMonitoringChartComponent: React.FC<PatientMonitoringChartProps> = ({ selectedMetrics, patientId = 'bed_01' }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { getFilteredData, loading } = useVitals(patientId);
  const renderTimeoutRef = useRef<NodeJS.Timeout>();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;

      // Parse timestamp correctly - handle DD/MM/YYYY format from API
      const formatTimestamp = (timestamp: string) => {
        if (!timestamp) return label;

        // Check if timestamp is in DD/MM/YYYY, HH:MM:SS format
        if (timestamp.includes(',')) {
          const [datePart, timePart] = timestamp.split(', ');
          const [day, month, year] = datePart.split('/');
          // Create date in correct format (month is 0-indexed in JS)
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (timePart) {
            const [hours, minutes, seconds] = timePart.split(':');
            date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
          }
          return date.toLocaleString();
        }

        // Fallback to direct parsing
        return new Date(timestamp).toLocaleString();
      };

      return (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
          {/* Show actual timestamp from data */}
          <p className="text-white font-medium mb-2">
            {formatTimestamp(dataPoint?.actualTimestamp)}
          </p>
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
              temperature: '°F',
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

  // Debounced time range handler to prevent rapid re-renders
  const debouncedSetTimeRange = useCallback(
    debounce((newRange: TimeRange) => {
      setTimeRange(newRange);
      setIsInitialLoad(false);
    }, 300),
    []
  );

  // Progressive rendering with requestAnimationFrame
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        setIsInitialLoad(false);
      });
    }, 100);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [timeRange]);

  const chartData = useMemo(() => {
    const data = getFilteredData(timeRange);

    // Log first and last timestamps to verify we're using correct data
    if (data.length > 0) {
      console.log('Chart data time range:', {
        first: data[0].timestamp,
        last: data[data.length - 1].timestamp,
        count: data.length,
        isInitialLoad
      });
    }

    return data.map((item, index) => {
      // Use index for continuous display, preserve timestamp for tooltip
      const date = new Date(item.timestamp);

      // Format labels with clean, predictable intervals
      let displayLabel = '';
      const hours = date.getHours();
      const minutes = date.getMinutes();

      if (timeRange === '1w') {
        // For weekly view, show dates
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        displayLabel = `${months[date.getMonth()]} ${date.getDate()}`;
      } else if (timeRange === '24h' || timeRange === '12h') {
        // For 24h and 12h views, round to nearest hour
        const roundedHour = minutes >= 30 ? (hours + 1) % 24 : hours;
        displayLabel = `${roundedHour.toString().padStart(2, '0')}:00`;
      } else if (timeRange === '4h') {
        // For 4h view, show hour and rounded minutes (00 or 30)
        const roundedMinutes = minutes >= 45 ? 0 : minutes >= 15 ? 30 : 0;
        const adjustedHour = roundedMinutes === 0 && minutes >= 45 ? (hours + 1) % 24 : hours;
        displayLabel = `${adjustedHour.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
      } else if (timeRange === '1h') {
        // For 1h view, round to nearest 10 minutes
        const roundedMinutes = Math.round(minutes / 10) * 10;
        const adjustedMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
        const adjustedHour = roundedMinutes === 60 ? (hours + 1) % 24 : hours;
        displayLabel = `${adjustedHour.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
      }

      return {
        // Always return a label - let XAxis interval prop handle which ones to show
        time: displayLabel || `${hours.toString().padStart(2, '0')}:00`,
        // Preserve actual timestamp for tooltip
        actualTimestamp: item.timestamp,
        // Vital values
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
    <div className="w-full mt-6 bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl">Vital Signs</h3>
        <div className="flex gap-2">
          {['1h', '4h', '12h', '24h', '1w'].map((range) => (
            <button
              key={range}
              onClick={() => debouncedSetTimeRange(range as TimeRange)}
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
            <XAxis
              dataKey="time"
              interval={Math.max(0, Math.floor(chartData.length / 10) - 1)}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              stroke="#4B5563"
              angle={0}
              textAnchor="middle"
              height={60}
            />
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

// Memoized export to prevent unnecessary re-renders
export const PatientMonitoringChart = React.memo(PatientMonitoringChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.patientId === nextProps.patientId &&
    JSON.stringify(prevProps.selectedMetrics) === JSON.stringify(nextProps.selectedMetrics)
  );
});