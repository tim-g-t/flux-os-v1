import React, { useState, useMemo } from 'react';
import { useVitals } from '@/hooks/useVitals';
import { calculateRiskScores } from '@/utils/riskCalculations';

type FilterType = 'All' | 'Gainers' | 'Losers';

export const RiskScores: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const { getLatestVitals, loading } = useVitals('bed_15');

  const riskScores = useMemo(() => {
    const latestVitals = getLatestVitals();
    if (!latestVitals) return null;
    return calculateRiskScores(latestVitals);
  }, [getLatestVitals]);

  const filters: FilterType[] = ['All', 'Gainers', 'Losers'];

  const getRiskColor = (risk: 'normal' | 'warning' | 'critical') => {
    switch (risk) {
      case 'normal': return 'bg-green-500/20 border-green-500';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500';
      case 'critical': return 'bg-red-500/20 border-red-500';
    }
  };

  if (loading || !riskScores) {
    return (
      <section className="bg-black flex w-full flex-col items-stretch text-white mt-6 pt-4 pb-[29px] px-[30px] rounded-[24px_24px_0px_0px] max-md:max-w-full max-md:mr-1 max-md:px-5">
        <div className="text-xl font-medium">Loading risk scores...</div>
      </section>
    );
  }

  return (
    <section className="bg-black flex w-full flex-col items-stretch text-white mt-6 pt-4 pb-[29px] px-[30px] rounded-[24px_24px_0px_0px] max-md:max-w-full max-md:mr-1 max-md:px-5">
      <div className="flex w-full items-stretch gap-5 flex-wrap justify-between max-md:max-w-full">
        <h2 className="text-xl font-medium my-auto">
          Risk Scores Overview
        </h2>
        <div className="flex items-stretch text-base font-normal whitespace-nowrap">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex items-center gap-2.5 justify-center px-[26px] py-[18px] rounded-[32px] max-md:px-5 transition-colors ${
                activeFilter === filter
                  ? 'bg-[rgba(1,119,251,1)]'
                  : 'border border-white border-solid hover:bg-white hover:text-black'
              }`}
            >
              <div className="self-stretch my-auto">
                {filter}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex w-[841px] max-w-full items-stretch gap-5 text-[17px] font-semibold justify-between ml-2.5 mt-6">
        <div className="flex items-stretch gap-[40px_81px]">
          <div>Stock</div>
          <div>Last Value</div>
          <div>Change</div>
        </div>
        <div className="flex items-stretch gap-9">
          <div className="basis-auto">
            Baseline (24h)
          </div>
          <div>Average (4h)</div>
        </div>
        <div>Last 7 days</div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-4 border-[rgba(67,69,75,1)]" />
      <div className={`border flex items-start gap-[25px] text-base font-normal flex-wrap mt-2.5 pl-2.5 pr-20 py-[3px] rounded-[30px] max-md:pr-5 ${getRiskColor(riskScores.shockIndex.risk)}`}>
        <div className="flex items-stretch gap-1.5 my-auto">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/77d20bbda661926babc225b74e5bec5714bfa5ee?placeholderIfAbsent=true"
            alt="Shock Index indicator"
            className="aspect-[1] object-contain w-[18px] shrink-0"
          />
          <div>Shock Index</div>
        </div>
        <div className="flex items-center gap-[40px_96px] flex-wrap grow shrink basis-auto -mt-1 max-md:max-w-full">
          <div className="self-stretch my-auto">
            {riskScores.shockIndex.value}
          </div>
          <div className="self-stretch my-auto">
            {riskScores.shockIndex.risk === 'normal' ? '+0.0%' : riskScores.shockIndex.risk === 'warning' ? '+15.2%' : '+45.8%'}
          </div>
          <div className="self-stretch my-auto">
            {riskScores.shockIndex.description}
          </div>
          <div className="self-stretch my-auto">
            Normal: 0.5-0.7
          </div>
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
            alt="Shock Index trend chart"
            className="aspect-[1.74] object-contain w-20 self-stretch shrink-0"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-[7px] border-[rgba(67,69,75,1)]" />
      <div className={`border flex items-stretch gap-[26px] text-base font-normal flex-wrap ml-2.5 mt-[13px] pl-2.5 pr-20 py-[3px] rounded-[30px] max-md:pr-5 ${getRiskColor(riskScores.pewsScore.risk)}`}>
        <div className="flex items-stretch gap-2 mt-2">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/4b316070aa76a3d90172ae5038e741544fbdf8d6?placeholderIfAbsent=true"
            alt="PEWS Score indicator"
            className="aspect-[0.76] object-contain w-4 shrink-0"
          />
          <div>PEWS Score</div>
        </div>
        <div className="flex items-center gap-[40px_97px] flex-wrap grow shrink basis-auto max-md:max-w-full">
          <div className="self-stretch my-auto">
            {riskScores.pewsScore.value}
          </div>
          <div className="self-stretch my-auto">
            {riskScores.pewsScore.risk === 'normal' ? '0.0%' : riskScores.pewsScore.risk === 'warning' ? '+8.5%' : '+22.3%'}
          </div>
          <div className="self-stretch my-auto">
            {riskScores.pewsScore.description}
          </div>
          <div className="self-stretch my-auto">
            Normal: 0-1
          </div>
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/6edec5d6-e840-4f8c-b946-a846307005c3?placeholderIfAbsent=true"
            alt="PEWS Score trend chart"
            className="aspect-[1.75] object-contain w-[82px] self-stretch shrink-0"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-1 border-[rgba(67,69,75,1)]" />
    </section>
  );
};
