import React from 'react';
import { MetricCard } from '@/components/ui/metric-card';

export const VitalSigns: React.FC = () => {
  return (
    <section className="w-[78%] ml-5 max-md:w-full max-md:ml-0">
      <div className="bg-black w-full mx-auto px-8 py-5 rounded-3xl max-md:max-w-full max-md:mt-10 max-md:px-5">
        <div className="flex w-full items-stretch gap-[40px_100px] flex-wrap max-md:max-w-full">
          <h2 className="text-white text-xl font-medium my-auto">
            Current Vital Signs
          </h2>
          <div className="flex flex-1">
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
            value="172"
            change="+12.31 (0.7%)"
            changeType="positive"
            label="Pulse"
            className="pl-4 pr-[34px]"
          />
          <MetricCard
            value="93"
            change="-12.31 (0.7%)"
            changeType="negative"
            label="Blood Pressure"
          />
          <MetricCard
            value="117"
            change="+12.31 (0.7%)"
            changeType="positive"
            label="Blood Pressure"
            className="px-[15px]"
          />
          <MetricCard
            value="11.3"
            change="+12.31 (0.7%)"
            changeType="negative"
            label="SpO2"
            className="pl-4 pr-[34px]"
          />
          <MetricCard
            value="98.3"
            change="+12.31 (0.7%)"
            changeType="positive"
            label="Temp"
            className="pl-[15px] pr-[34px]"
          />
        </div>
      </div>
    </section>
  );
};
