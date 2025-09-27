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
    <article className="w-[18%] max-md:w-full max-md:ml-0">
      <div className="flex flex-col relative h-full grow text-xl text-white font-medium rounded-3xl max-md:mt-10">
        <img
          src={backgroundImage}
          alt={`Patient ${patientName} background`}
          className="absolute h-full w-full object-cover inset-0"
        />
        <div className="relative bg-[rgba(13,13,13,0.6)] flex flex-col h-full py-5 px-4 rounded-3xl max-md:px-3">
          <div className="text-xl font-medium text-white mb-auto">{bedNumber}</div>
          <div className="flex flex-col gap-[9px] mt-auto">
            <div className="text-xl font-medium">
              {patientName}
            </div>
            <div className="text-xl font-medium">
              {demographics}
            </div>
            <div className="text-[44px] font-bold">
              {duration}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
