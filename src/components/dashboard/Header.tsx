import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="w-full max-md:max-w-full max-md:mt-10">
      <div className="flex w-full max-w-[1362px] items-stretch gap-5 flex-wrap justify-between mr-8 max-md:max-w-full max-md:mr-2.5">
        <div className="flex gap-[-1px] text-xl text-white font-normal whitespace-nowrap">
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
        <div className="flex items-stretch gap-[40px_81px] flex-wrap max-md:max-w-full">
          <div className="bg-[rgba(26,27,32,1)] flex items-center gap-[11px] text-[21px] text-[rgba(203,204,209,1)] font-normal grow shrink basis-auto pl-[27px] pr-[159px] py-[18px] rounded-[36px] max-md:px-5">
            <div className="self-stretch flex w-6 shrink-0 h-6 my-auto" />
            <input
              type="text"
              placeholder="Ask Flux.io anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="self-stretch my-auto bg-transparent border-none outline-none text-[rgba(203,204,209,1)] placeholder-[rgba(203,204,209,1)]"
            />
          </div>
          <div className="flex gap-[40px_48px] grow shrink basis-auto justify-end">
            <div className="flex w-[122px]">
              <button className="bg-[rgba(26,27,32,1)] flex items-center gap-2.5 w-[61px] h-[61px] p-5 rounded-[50px] hover:bg-[rgba(36,37,42,1)] transition-colors">
                <div className="flex min-h-[21px] w-[21px]" />
              </button>
              <button className="bg-[rgba(26,27,32,1)] flex items-center gap-2.5 w-[61px] h-[61px] p-5 rounded-[50px] hover:bg-[rgba(36,37,42,1)] transition-colors">
                <div className="flex min-h-[21px] w-[21px]" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-white w-[178px]">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/86424b5c1fe3cde9a22ae1043b230b6d1f8c873f?placeholderIfAbsent=true"
                alt="User avatar"
                className="aspect-[1] object-contain w-[61px] self-stretch shrink-0 gap-2.5 my-auto py-5 rounded-[50px]"
              />
              <div className="self-stretch my-auto">
                <div className="text-lg font-normal">
                  Naya Rachel
                </div>
                <div className="text-sm font-light">
                  rachel@gmail.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
