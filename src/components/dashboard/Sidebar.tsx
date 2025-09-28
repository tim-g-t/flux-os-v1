import React, { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="w-[17%] max-md:w-full max-md:ml-0 sticky top-0 h-screen overflow-y-auto">
      <div className="flex flex-col items-stretch pb-8">
        <div className="flex flex-col items-stretch pl-[23px] max-md:pl-5">
          <div className="flex items-center h-[97px] max-md:h-[80px]">
            <div className="text-white text-[40px] font-bold ml-[41px] max-md:ml-2.5">
              Flux
            </div>
          </div>
          <div className="mt-6 max-md:mt-10">
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
          className={`flex items-center gap-4 text-lg whitespace-nowrap justify-start mt-6 ml-[23px] pl-6 pr-[50px] py-[18px] max-md:mr-0.5 max-md:px-5 rounded-lg transition-all duration-200 ${
            activeView === 'Dashboard' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white font-normal hover:bg-[rgba(36,37,42,1)]'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className={`my-auto ${activeView === 'Dashboard' ? 'text-xl' : ''}`}>Dashboard</div>
        </button>
        
        {/* Patient Detail */}
        <button 
          onClick={() => onViewChange('Patient Detail')}
          className={`flex items-center gap-4 text-lg whitespace-nowrap justify-start mt-6 ml-[47px] pl-6 pr-[50px] py-[18px] max-md:mr-0.5 max-md:px-5 rounded-lg transition-all duration-200 ${
            activeView === 'Patient Detail' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white font-normal hover:bg-[rgba(36,37,42,1)]'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className={`my-auto ${activeView === 'Patient Detail' ? 'text-xl' : ''}`}>Patient Detail</div>
        </button>
        
        {/* Analytics */}
        <button 
          onClick={() => onViewChange('Analytics')}
          className={`flex items-center gap-4 text-lg whitespace-nowrap justify-start mt-6 ml-[47px] pl-6 pr-[50px] py-[18px] max-md:mr-0.5 max-md:px-5 rounded-lg transition-all duration-200 ${
            activeView === 'Analytics' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white font-normal hover:bg-[rgba(36,37,42,1)]'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className={`my-auto ${activeView === 'Analytics' ? 'text-xl' : ''}`}>Analytics</div>
        </button>
        
        {/* Reports */}
        <button 
          onClick={() => onViewChange('Reports')}
          className={`flex items-center gap-4 text-lg whitespace-nowrap justify-start mt-6 ml-[47px] pl-6 pr-[50px] py-[18px] max-md:mr-0.5 max-md:px-5 rounded-lg transition-all duration-200 ${
            activeView === 'Reports' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white font-normal hover:bg-[rgba(36,37,42,1)]'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className={`my-auto ${activeView === 'Reports' ? 'text-xl' : ''}`}>Reports</div>
        </button>
        
        {/* Separator */}
        <div className="border w-[276px] shrink-0 max-w-full h-0 mt-8 border-[rgba(64,66,73,1)] border-solid max-md:mr-2" />
        
        {/* Settings */}
        <button 
          onClick={() => onViewChange('Settings')}
          className={`flex items-center gap-4 text-lg whitespace-nowrap justify-start mt-8 ml-[23px] pl-6 pr-[50px] py-[18px] max-md:mr-0.5 max-md:px-5 rounded-lg transition-all duration-200 ${
            activeView === 'Settings' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white font-normal hover:bg-[rgba(36,37,42,1)]'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className={`my-auto ${activeView === 'Settings' ? 'text-xl' : ''}`}>Settings</div>
        </button>
        
        {/* Help & Support */}
        <button 
          onClick={() => onViewChange('Help & Support')}
          className={`flex items-center gap-4 text-lg whitespace-nowrap justify-start mt-6 ml-[23px] pl-6 pr-[50px] py-[18px] max-md:mr-0.5 max-md:px-5 rounded-lg transition-all duration-200 ${
            activeView === 'Help & Support' 
              ? 'bg-[rgba(1,119,251,1)] text-white font-semibold' 
              : 'text-white font-normal hover:bg-[rgba(36,37,42,1)]'
          }`}
        >
          <div className="flex w-[21px] shrink-0 h-5 my-auto" />
          <div className={`my-auto ${activeView === 'Help & Support' ? 'text-xl' : ''}`}>Help & Support</div>
        </button>
      </div>
    </nav>
  );
};
