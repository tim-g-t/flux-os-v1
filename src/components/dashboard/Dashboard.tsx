import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatientCard } from './PatientCard';
import { VitalSigns } from './VitalSigns';
import { RiskScores } from './RiskScores';

export const Dashboard: React.FC = () => {
  return (
    <div className="bg-black overflow-hidden pl-[27px] pt-10 max-md:pl-5">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <Sidebar />
        <main className="w-[83%] ml-5 max-md:w-full max-md:ml-0">
          <Header />
          <div className="bg-[rgba(26,27,32,1)] border w-full mt-8 pt-6 px-6 rounded-[32px_0px_0px_0px] border-[rgba(64,66,73,1)] border-solid max-md:max-w-full max-md:px-5">
            <div className="max-md:max-w-full max-md:mr-[9px]">
              <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
                <PatientCard
                  bedNumber="Bed 15"
                  patientName="Simon A."
                  demographics="45 y / male"
                  duration="142h"
                  backgroundImage="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/2220c47d41763dce90f54255d3e777f05d747c07?placeholderIfAbsent=true"
                />
                <VitalSigns />
              </div>
            </div>
            <img
              src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/050f8929904351d6ef901d327869f15aa6f28679?placeholderIfAbsent=true"
              alt="Patient monitoring chart"
              className="aspect-[3.68] object-contain w-full mt-6 max-md:max-w-full"
            />
            <RiskScores />
          </div>
        </main>
      </div>
    </div>
  );
};
