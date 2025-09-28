import React from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface MiniChartProps {
  data: Array<{ time: string; value: number }>;
  color: string;
  selectedVital: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, color, selectedVital }) => {
  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            width={25}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-white text-sm font-medium">
                      {`${selectedVital}: ${payload[0].value}`}
                    </p>
                    <p className="text-[rgba(203,204,209,1)] text-xs">
                      {label}
                    </p>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};