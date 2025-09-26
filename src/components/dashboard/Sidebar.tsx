import React from 'react';

export const Sidebar: React.FC = () => {
  return (
    <nav className="w-[17%] max-md:w-full max-md:ml-0">
      <div className="flex flex-col items-stretch mt-3 max-md:mt-10">
        <div className="flex flex-col items-stretch pl-[23px] max-md:pl-5">
          <div className="text-white text-[25px] font-bold ml-[41px] max-md:ml-2.5">
            Flux
          </div>
          <div className="mt-[72px] max-md:mt-10">
            <div className="text-white text-[32px] font-medium">
              <span style={{fontWeight: 400, color: 'rgba(133,160,189,1)'}}>
                Welcome,
              </span>{" "}
              <span style={{fontWeight: 600}}>Naya </span>
            </div>
            <div className="text-[rgba(217,217,217,1)] text-base font-normal">
              Here's your patient portfolio overview
            </div>
          </div>
        </div>
        <div className="border w-[276px] shrink-0 max-w-full h-0 mt-10 border-[rgba(64,66,73,1)] border-solid max-md:mr-2" />
        <div className="text-[rgba(217,217,217,1)] text-xs font-normal ml-[23px] mt-10 max-md:ml-2.5">
          Main Menu
        </div>
        <div className="rounded bg-[rgba(1,119,251,1)] flex flex-col text-lg text-white font-semibold whitespace-nowrap justify-center mt-6 pl-6 pr-[132px] py-[18px] max-md:mr-0.5 max-md:px-5">
          <div className="flex items-center gap-4">
            <div className="self-stretch flex w-[21px] shrink-0 h-5 my-auto" />
            <div className="self-stretch flex gap-2.5 my-auto">
              <div>Dashboard</div>
            </div>
          </div>
        </div>
        <div className="flex w-[158px] max-w-full flex-col text-lg text-white font-normal ml-[23px] mt-6 max-md:ml-2.5">
          <div className="flex items-center gap-4 whitespace-nowrap">
            <div className="self-stretch flex w-[21px] shrink-0 h-5 my-auto" />
            <div className="self-stretch flex gap-2.5 my-auto">
              <div>Patients</div>
            </div>
          </div>
          <div className="flex items-center gap-4 whitespace-nowrap mt-6">
            <div className="self-stretch flex w-[21px] shrink-0 h-5 my-auto" />
            <div className="self-stretch flex gap-2.5 my-auto">
              <div>Analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-4 whitespace-nowrap mt-6">
            <div className="self-stretch flex w-[21px] shrink-0 h-5 my-auto" />
            <div className="self-stretch my-auto">
              Report
            </div>
          </div>
          <div className="text-[rgba(217,217,217,1)] text-xs mt-[72px] max-md:mt-10">
            Support
          </div>
          <div className="self-stretch flex flex-col items-stretch mt-6">
            <div className="flex items-center gap-4 whitespace-nowrap">
              <div className="self-stretch flex w-[21px] shrink-0 h-5 my-auto" />
              <div className="self-stretch my-auto">
                Community
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <div className="flex w-[21px] shrink-0 h-[21px]" />
              <div>Help & Support</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
