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
      case 'normal': return 'border-[rgba(67,69,75,1)]'; // No highlighting for normal
      case 'warning': return 'bg-yellow-500/20 border-yellow-500';
      case 'critical': return 'bg-red-500/30 border-red-500';
    }
  };

  if (loading || !riskScores) {
    return (
      <section className="bg-black flex w-full flex-col items-stretch text-white mt-4 lg:mt-6 pt-3 lg:pt-4 pb-6 lg:pb-[29px] px-4 lg:px-[30px] rounded-2xl lg:rounded-[24px_24px_0px_0px]">
        <div className="text-lg lg:text-xl font-medium">Loading risk scores...</div>
      </section>
    );
  }

  return (
    <section className="bg-black flex w-full flex-col items-stretch text-white mt-4 lg:mt-6 pt-3 lg:pt-4 pb-6 lg:pb-[29px] px-4 lg:px-[30px] rounded-2xl lg:rounded-[24px_24px_0px_0px] overflow-hidden">
      <div className="flex w-full items-center gap-3 lg:gap-5 flex-wrap justify-between">
        <h2 className="text-lg lg:text-xl font-medium">
          Risk Scores Overview
        </h2>
        <div className="flex items-center gap-2 text-sm lg:text-base font-normal whitespace-nowrap">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex items-center justify-center px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-3xl transition-colors ${
                activeFilter === filter
                  ? 'bg-[rgba(1,119,251,1)]'
                  : 'border border-white border-solid hover:bg-white hover:text-black'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
        <div className="min-w-[900px] lg:min-w-0">
          <div className="flex w-full items-center text-sm lg:text-base font-semibold mt-4 lg:mt-6 px-2">
            <div className="w-[180px] lg:w-[200px] flex items-center">Risk Score</div>
            <div className="w-[80px] lg:w-[100px] flex items-center">Last Value</div>
            <div className="w-[80px] lg:w-[100px] flex items-center">Change</div>
            <div className="w-[160px] lg:w-[200px] flex items-center">Baseline (24h)</div>
            <div className="w-[120px] lg:w-[150px] flex items-center">Average (4h)</div>
            <div className="w-[100px] lg:w-[120px] flex items-center justify-center">Last 7 days</div>
          </div>
          <div className="w-full h-px mt-3 lg:mt-4 bg-[rgba(67,69,75,1)]" />
          <div className={`border flex items-center text-sm lg:text-base font-normal mt-2 lg:mt-2.5 px-2 py-2 rounded-3xl ${getRiskColor(riskScores.shockIndex.risk)}`}>
            <div className="w-[180px] lg:w-[200px] flex items-center gap-1.5">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/77d20bbda661926babc225b74e5bec5714bfa5ee?placeholderIfAbsent=true"
                alt="Shock Index indicator"
                className="aspect-square object-contain w-4 shrink-0"
              />
              <div className="truncate">Shock Index - Early deterioration detector</div>
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.shockIndex.value}
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.shockIndex.risk === 'normal' ? '+0.0%' : riskScores.shockIndex.risk === 'warning' ? '+15.2%' : '+45.8%'}
            </div>
            <div className="w-[160px] lg:w-[200px] flex items-center truncate">
              {riskScores.shockIndex.description}
            </div>
            <div className="w-[120px] lg:w-[150px] flex items-center">
              Normal: 0.5-0.7
            </div>
            <div className="w-[100px] lg:w-[120px] flex items-center justify-center">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
                alt="Shock Index trend chart"
                className="aspect-[1.74] object-contain w-16 lg:w-20"
              />
            </div>
          </div>
          <div className="w-full h-px mt-2 bg-[rgba(67,69,75,1)]" />
          
          <div className={`border flex items-center text-sm lg:text-base font-normal mt-2 lg:mt-2.5 px-2 py-2 rounded-3xl ${getRiskColor(riskScores.pewsScore.risk)}`}>
            <div className="w-[180px] lg:w-[200px] flex items-center gap-1.5">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/4b316070aa76a3d90172ae5038e741544fbdf8d6?placeholderIfAbsent=true"
                alt="PEWS Score indicator"
                className="aspect-[0.76] object-contain w-4 shrink-0"
              />
              <div className="truncate">PEWS Score</div>
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.pewsScore.value}
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.pewsScore.risk === 'normal' ? '0.0%' : riskScores.pewsScore.risk === 'warning' ? '+8.5%' : '+22.3%'}
            </div>
            <div className="w-[160px] lg:w-[200px] flex items-center truncate">
              {riskScores.pewsScore.description}
            </div>
            <div className="w-[120px] lg:w-[150px] flex items-center">
              Normal: 0-1
            </div>
            <div className="w-[100px] lg:w-[120px] flex items-center justify-center">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/6edec5d6-e840-4f8c-b946-a846307005c3?placeholderIfAbsent=true"
                alt="PEWS Score trend chart"
                className="aspect-[1.75] object-contain w-16 lg:w-20"
              />
            </div>
          </div>
          <div className="w-full h-px mt-2 bg-[rgba(67,69,75,1)]" />
          
          {/* MAP - #1 perfusion indicator */}
          <div className={`border flex items-center text-sm lg:text-base font-normal mt-2 lg:mt-2.5 px-2 py-2 rounded-3xl ${getRiskColor(riskScores.map.risk)}`}>
            <div className="w-[180px] lg:w-[200px] flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-500 rounded-full shrink-0"></div>
              <div className="truncate">MAP - #1 perfusion indicator</div>
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.map.value}
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.map.risk === 'normal' ? '+0.0%' : riskScores.map.risk === 'warning' ? '+5.2%' : '+12.8%'}
            </div>
            <div className="w-[160px] lg:w-[200px] flex items-center truncate">
              {riskScores.map.description}
            </div>
            <div className="w-[120px] lg:w-[150px] flex items-center">
              Normal: 70-100
            </div>
            <div className="w-[100px] lg:w-[120px] flex items-center justify-center">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
                alt="MAP trend chart"
                className="aspect-[1.74] object-contain w-16 lg:w-20"
              />
            </div>
          </div>
          <div className="w-full h-px mt-2 bg-[rgba(67,69,75,1)]" />
          
          {/* qSOFA - Sepsis screening requirement */}
          <div className={`border flex items-center text-sm lg:text-base font-normal mt-2 lg:mt-2.5 px-2 py-2 rounded-3xl ${getRiskColor(riskScores.qsofa.risk)}`}>
            <div className="w-[180px] lg:w-[200px] flex items-center gap-1.5">
              <div className="w-4 h-4 bg-red-500 rounded-full shrink-0"></div>
              <div className="truncate">qSOFA - Sepsis screening requirement</div>
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.qsofa.value}
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.qsofa.risk === 'normal' ? '0.0%' : riskScores.qsofa.risk === 'warning' ? '+2.3%' : '+15.6%'}
            </div>
            <div className="w-[160px] lg:w-[200px] flex items-center truncate">
              {riskScores.qsofa.description}
            </div>
            <div className="w-[120px] lg:w-[150px] flex items-center">
              Normal: 0
            </div>
            <div className="w-[100px] lg:w-[120px] flex items-center justify-center">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/6edec5d6-e840-4f8c-b946-a846307005c3?placeholderIfAbsent=true"
                alt="qSOFA trend chart"
                className="aspect-[1.75] object-contain w-16 lg:w-20"
              />
            </div>
          </div>
          <div className="w-full h-px mt-2 bg-[rgba(67,69,75,1)]" />
          
          {/* Pulse Pressure - Volume status indicator */}
          <div className={`border flex items-center text-sm lg:text-base font-normal mt-2 lg:mt-2.5 px-2 py-2 rounded-3xl ${getRiskColor(riskScores.pulsePressure.risk)}`}>
            <div className="w-[180px] lg:w-[200px] flex items-center gap-1.5">
              <div className="w-4 h-4 bg-purple-500 rounded-full shrink-0"></div>
              <div className="truncate">Pulse Pressure - Volume status indicator</div>
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.pulsePressure.value}
            </div>
            <div className="w-[80px] lg:w-[100px] flex items-center">
              {riskScores.pulsePressure.risk === 'normal' ? '+0.0%' : riskScores.pulsePressure.risk === 'warning' ? '+4.2%' : '+9.1%'}
            </div>
            <div className="w-[160px] lg:w-[200px] flex items-center truncate">
              {riskScores.pulsePressure.description}
            </div>
            <div className="w-[120px] lg:w-[150px] flex items-center">
              Normal: 40-60
            </div>
            <div className="w-[100px] lg:w-[120px] flex items-center justify-center">
              <img
                src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
                alt="Pulse Pressure trend chart"
                className="aspect-[1.74] object-contain w-16 lg:w-20"
              />
            </div>
          </div>
          <div className="w-full h-px mt-2 bg-[rgba(67,69,75,1)]" />
        </div>
      </div>
     </section>
  );
};
