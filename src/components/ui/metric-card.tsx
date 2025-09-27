import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  label: string;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  change,
  changeType,
  label,
  className,
  onClick,
  isSelected = false
}) => {
  return (
    <div 
      className={cn(
        "bg-[rgba(20,21,25,1)] flex flex-col flex-1 pt-4 pb-1.5 px-4 rounded-3xl transition-all duration-200",
        onClick && "cursor-pointer hover:bg-[rgba(30,31,35,1)]",
        isSelected && "ring-2 ring-blue-500 bg-[rgba(30,31,40,1)]",
        className
      )}
      onClick={onClick ? () => {
        console.log('MetricCard clicked:', label, onClick);
        onClick();
      } : undefined}
    >
      <div className="h-[66px]">
        <div className="text-white text-5xl font-bold max-md:text-[40px]">
          {value}
        </div>
        <div className={cn(
          "text-xs font-normal mt-1",
          changeType === 'positive' ? "text-[rgba(17,236,121,1)]" : "text-[rgba(252,26,26,1)]"
        )}>
          {change}
        </div>
      </div>
      <div className="text-white text-xl font-normal mt-[37px]">
        {label}
      </div>
    </div>
  );
};
