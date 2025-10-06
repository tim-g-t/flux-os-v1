import React from 'react';

interface PatientCardProps {
  bedNumber: string;
  patientName: string;
  demographics: string;
  duration: string;
  backgroundImage: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  bedNumber,
  patientName,
  demographics,
  duration,
  backgroundImage
}) => {
  return (
    <article className="w-full xl:w-[240px] xl:min-w-[240px]">
      <div className="flex flex-col relative h-full min-h-[280px] lg:min-h-[320px] text-xl text-white font-medium rounded-2xl lg:rounded-[32px]">
        <img
          src={backgroundImage}
          alt={`Patient ${patientName} background`}
          className="absolute h-full w-full object-cover inset-0 rounded-2xl lg:rounded-[32px]"
        />
        <div className="relative bg-black bg-opacity-60 flex flex-col h-full py-4 lg:py-5 px-3 lg:px-4 rounded-2xl lg:rounded-[32px]">
          <div className="text-lg lg:text-xl font-medium text-white mb-auto">{bedNumber}</div>
          <div className="flex flex-col gap-2 lg:gap-[9px] mt-auto">
            <div className="text-lg lg:text-xl font-medium">
              {patientName}
            </div>
            <div className="text-lg lg:text-xl font-medium">
              {demographics}
            </div>
            <div className="text-3xl lg:text-[44px] font-bold">
              {duration}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
