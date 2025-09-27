import React, { useState } from 'react';
import { Bell, Settings, Search } from 'lucide-react';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="w-full max-md:max-w-full max-md:mt-10">
      <div className="flex w-full items-center justify-between gap-5 max-md:flex-col max-md:items-stretch max-md:gap-4">
        {/* Left Navigation */}
        <div className="flex gap-[-1px] text-xl text-white font-normal whitespace-nowrap max-md:justify-center">
          <button className="bg-[rgba(26,27,32,1)] flex items-center gap-[11px] justify-center pl-[27px] pr-[26px] py-[18px] rounded-[36px] max-md:px-5 hover:bg-[rgba(36,37,42,1)] transition-colors">
            <div className="self-stretch my-auto">
              Patient
            </div>
          </button>
          <button className="bg-[rgba(26,27,32,1)] flex items-center gap-[11px] justify-center px-[27px] py-[18px] rounded-[36px] max-md:px-5 hover:bg-[rgba(36,37,42,1)] transition-colors">
            <div className="self-stretch my-auto">
              Wallets
            </div>
          </button>
          <button className="bg-[rgba(26,27,32,1)] flex items-center gap-[11px] justify-center px-[27px] py-[18px] rounded-[36px] max-md:px-5 hover:bg-[rgba(36,37,42,1)] transition-colors">
            <div className="self-stretch my-auto">
              Tools
            </div>
          </button>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-[600px] mx-8 max-md:mx-0 max-md:max-w-full max-md:order-3">
          <div className="bg-[rgba(26,27,32,1)] flex items-center gap-3 text-[21px] text-[rgba(203,204,209,1)] font-normal pl-[27px] pr-[27px] py-[18px] rounded-[36px] max-md:px-5">
            <Search className="w-6 h-6 text-[rgba(203,204,209,1)]" />
            <input
              type="text"
              placeholder="Ask Flux.io anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[rgba(203,204,209,1)] placeholder-[rgba(203,204,209,1)]"
            />
          </div>
        </div>

        {/* Right User Profile & Notifications */}
        <div className="flex items-center gap-4 pr-6 max-md:justify-center max-md:pr-0 max-md:order-2">
          {/* Notifications */}
          <div className="flex gap-3">
            <button className="bg-[rgba(26,27,32,1)] flex items-center justify-center w-[61px] h-[61px] rounded-[50px] hover:bg-[rgba(36,37,42,1)] transition-colors max-md:w-[50px] max-md:h-[50px]">
              <Bell className="w-[21px] h-[21px] text-white max-md:w-[18px] max-md:h-[18px]" />
            </button>
            <button className="bg-[rgba(26,27,32,1)] flex items-center justify-center w-[61px] h-[61px] rounded-[50px] hover:bg-[rgba(36,37,42,1)] transition-colors max-md:w-[50px] max-md:h-[50px]">
              <Settings className="w-[21px] h-[21px] text-white max-md:w-[18px] max-md:h-[18px]" />
            </button>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center gap-3 text-white max-md:gap-2">
            <img
              src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/86424b5c1fe3cde9a22ae1043b230b6d1f8c873f?placeholderIfAbsent=true"
              alt="User avatar"
              className="w-[61px] h-[61px] rounded-[50px] object-cover max-md:w-[50px] max-md:h-[50px]"
            />
            <div className="flex flex-col max-md:hidden">
              <div className="text-lg font-normal">
                Naya Rachel
              </div>
              <div className="text-sm font-light text-[rgba(203,204,209,1)]">
                rachel@gmail.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
