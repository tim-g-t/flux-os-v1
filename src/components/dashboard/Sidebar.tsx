import React, { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="w-[17%] max-md:w-full max-md:ml-0 sticky top-0 h-screen overflow-y-auto">
      <div className="flex flex-col items-stretch mt-3 max-md:mt-10 pb-8">
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
        
        {/* Dashboard */}
        <button 
          onClick={() => onViewChange('Dashboard')}
          className={`flex items-center gap-4 text-lg font-normal ml-[23px] mt-6 max-md:ml-2.5 transition-all duration-200 hover:bg-[rgba(36,37,42,1)] rounded-lg py-2 px-3 ${
            activeView === 'Dashboard' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold scale-105' 
              : 'text-white hover:text-white'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className="my-auto">Dashboard</div>
        </button>
        
        {/* Patient Detail */}
        <button 
          onClick={() => onViewChange('Patient Detail')}
          className={`flex items-center gap-4 text-lg whitespace-nowrap justify-start mt-6 ml-[23px] pl-6 pr-[132px] py-[18px] max-md:mr-0.5 max-md:px-5 rounded-lg transition-all duration-200 hover:bg-[rgba(36,37,42,1)] ${
            activeView === 'Patient Detail' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold scale-105' 
              : 'text-white font-normal'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className="my-auto">Patient Detail</div>
        </button>
        
        {/* Analytics */}
        <button 
          onClick={() => onViewChange('Analytics')}
          className={`flex items-center gap-4 text-lg font-normal ml-[23px] mt-6 max-md:ml-2.5 transition-colors hover:bg-[rgba(36,37,42,1)] rounded-lg py-2 px-3 ${
            activeView === 'Analytics' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white hover:text-white'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className="my-auto">Analytics</div>
        </button>
        
        {/* Reports */}
        <button 
          onClick={() => onViewChange('Reports')}
          className={`flex items-center gap-4 text-lg font-normal ml-[23px] mt-6 max-md:ml-2.5 transition-colors hover:bg-[rgba(36,37,42,1)] rounded-lg py-2 px-3 ${
            activeView === 'Reports' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white hover:text-white'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className="my-auto">Reports</div>
        </button>
        
        {/* Separator */}
        <div className="border w-[276px] shrink-0 max-w-full h-0 mt-8 border-[rgba(64,66,73,1)] border-solid max-md:mr-2" />
        
        {/* Help & Support */}
        <button 
          onClick={() => onViewChange('Help & Support')}
          className={`flex items-center gap-4 text-lg font-normal ml-[23px] mt-8 max-md:ml-2.5 transition-colors hover:bg-[rgba(36,37,42,1)] rounded-lg py-2 px-3 ${
            activeView === 'Help & Support' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white hover:text-white'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className="my-auto">Help & Support</div>
        </button>
      </div>
    </nav>
  );
};
