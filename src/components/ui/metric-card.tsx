import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  value: React.ReactNode;
  change: string;
  changeType: 'positive' | 'negative';
  label: string;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
  trendIndicator?: 'double-up' | 'single-up' | 'neutral' | 'single-down' | 'double-down';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  change,
  changeType,
  label,
  className,
  onClick,
  isSelected = false,
  trendIndicator
}) => {
  return (
    <div 
      className={cn(
        "bg-[rgba(20,21,25,1)] flex flex-col pt-3 lg:pt-4 pb-1.5 px-3 lg:px-4 rounded-2xl lg:rounded-3xl transition-all duration-200 min-h-[140px] lg:min-h-[160px]",
        onClick && "cursor-pointer hover:bg-[rgba(30,31,35,1)]",
        isSelected && "ring-2 ring-blue-500 bg-[rgba(30,31,40,1)]",
        className
      )}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="text-white text-3xl lg:text-4xl xl:text-5xl font-bold">
          {value}
        </div>
        <div className={cn(
          "text-sm lg:text-base xl:text-lg font-medium mt-1 flex items-center gap-1",
          changeType === 'positive' ? "text-[rgba(17,236,121,1)]" : "text-[rgba(252,26,26,1)]"
        )}>
          {trendIndicator && (
            <span className="text-base lg:text-lg xl:text-xl">
              {trendIndicator === 'double-up' && '↗↗'}
              {trendIndicator === 'single-up' && '↗'}
              {trendIndicator === 'neutral' && '→'}
              {trendIndicator === 'single-down' && '↘'}
              {trendIndicator === 'double-down' && '↘↘'}
            </span>
          )}
          {change}
        </div>
      </div>
      <div className="text-white text-base lg:text-lg xl:text-xl font-normal mt-4 lg:mt-6">
        {label}
      </div>
    </div>
  );
};
