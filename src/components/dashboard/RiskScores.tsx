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
      <div className="flex w-full items-center text-[17px] font-semibold mt-6 px-2.5 max-md:px-0">
        <div className="w-[200px] flex items-center max-md:w-[160px]">Risk Score</div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">Last Value</div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">Change</div>
        <div className="w-[200px] flex items-center max-md:w-[160px]">Baseline (24h)</div>
        <div className="w-[150px] flex items-center max-md:w-[120px]">Average (4h)</div>
        <div className="w-[120px] flex items-center justify-center max-md:w-[100px]">Last 7 days</div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-4 border-[rgba(67,69,75,1)]" />
      <div className={`border flex items-center text-base font-normal mt-2.5 px-2.5 py-[8px] rounded-[30px] max-md:px-0 ${getRiskColor(riskScores.shockIndex.risk)}`}>
        <div className="w-[200px] flex items-center gap-1.5 max-md:w-[160px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/77d20bbda661926babc225b74e5bec5714bfa5ee?placeholderIfAbsent=true"
            alt="Shock Index indicator"
            className="aspect-[1] object-contain w-[18px] shrink-0"
          />
          <div>Shock Index - Early deterioration detector</div>
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.shockIndex.value}
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.shockIndex.risk === 'normal' ? '+0.0%' : riskScores.shockIndex.risk === 'warning' ? '+15.2%' : '+45.8%'}
        </div>
        <div className="w-[200px] flex items-center max-md:w-[160px]">
          {riskScores.shockIndex.description}
        </div>
        <div className="w-[150px] flex items-center max-md:w-[120px]">
          Normal: 0.5-0.7
        </div>
        <div className="w-[120px] flex items-center justify-center max-md:w-[100px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
            alt="Shock Index trend chart"
            className="aspect-[1.74] object-contain w-20"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-[7px] border-[rgba(67,69,75,1)]" />
      <div className={`border flex items-center text-base font-normal mt-2.5 px-2.5 py-[8px] rounded-[30px] max-md:px-0 ${getRiskColor(riskScores.pewsScore.risk)}`}>
        <div className="w-[200px] flex items-center gap-1.5 max-md:w-[160px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/4b316070aa76a3d90172ae5038e741544fbdf8d6?placeholderIfAbsent=true"
            alt="PEWS Score indicator"
            className="aspect-[0.76] object-contain w-4 shrink-0"
          />
          <div>PEWS Score</div>
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.pewsScore.value}
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.pewsScore.risk === 'normal' ? '0.0%' : riskScores.pewsScore.risk === 'warning' ? '+8.5%' : '+22.3%'}
        </div>
        <div className="w-[200px] flex items-center max-md:w-[160px]">
          {riskScores.pewsScore.description}
        </div>
        <div className="w-[150px] flex items-center max-md:w-[120px]">
          Normal: 0-1
        </div>
        <div className="w-[120px] flex items-center justify-center max-md:w-[100px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/6edec5d6-e840-4f8c-b946-a846307005c3?placeholderIfAbsent=true"
            alt="PEWS Score trend chart"
            className="aspect-[1.75] object-contain w-[82px]"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-[7px] border-[rgba(67,69,75,1)]" />
      
      {/* MAP - #1 perfusion indicator */}
      <div className={`border flex items-center text-base font-normal mt-2.5 px-2.5 py-[8px] rounded-[30px] max-md:px-0 ${getRiskColor(riskScores.map.risk)}`}>
        <div className="w-[200px] flex items-center gap-1.5 max-md:w-[160px]">
          <div className="w-4 h-4 bg-blue-500 rounded-full shrink-0"></div>
          <div>MAP - #1 perfusion indicator</div>
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.map.value}
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.map.risk === 'normal' ? '+0.0%' : riskScores.map.risk === 'warning' ? '+5.2%' : '+12.8%'}
        </div>
        <div className="w-[200px] flex items-center max-md:w-[160px]">
          {riskScores.map.description}
        </div>
        <div className="w-[150px] flex items-center max-md:w-[120px]">
          Normal: 70-100
        </div>
        <div className="w-[120px] flex items-center justify-center max-md:w-[100px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
            alt="MAP trend chart"
            className="aspect-[1.74] object-contain w-20"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-[7px] border-[rgba(67,69,75,1)]" />
      
      {/* ROX Index - Respiratory failure predictor */}
      <div className={`border flex items-center text-base font-normal mt-2.5 px-2.5 py-[8px] rounded-[30px] max-md:px-0 ${getRiskColor(riskScores.roxIndex.risk)}`}>
        <div className="w-[200px] flex items-center gap-1.5 max-md:w-[160px]">
          <div className="w-4 h-4 bg-green-500 rounded-full shrink-0"></div>
          <div>ROX Index - Respiratory failure predictor</div>
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.roxIndex.value}
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.roxIndex.risk === 'normal' ? '+0.0%' : riskScores.roxIndex.risk === 'warning' ? '+3.1%' : '+8.7%'}
        </div>
        <div className="w-[200px] flex items-center max-md:w-[160px]">
          {riskScores.roxIndex.description}
        </div>
        <div className="w-[150px] flex items-center max-md:w-[120px]">
          Normal: &gt;4.88
        </div>
        <div className="w-[120px] flex items-center justify-center max-md:w-[100px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
            alt="ROX Index trend chart"
            className="aspect-[1.74] object-contain w-20"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-[7px] border-[rgba(67,69,75,1)]" />
      
      {/* qSOFA - Sepsis screening requirement */}
      <div className={`border flex items-center text-base font-normal mt-2.5 px-2.5 py-[8px] rounded-[30px] max-md:px-0 ${getRiskColor(riskScores.qsofa.risk)}`}>
        <div className="w-[200px] flex items-center gap-1.5 max-md:w-[160px]">
          <div className="w-4 h-4 bg-red-500 rounded-full shrink-0"></div>
          <div>qSOFA - Sepsis screening requirement</div>
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.qsofa.value}
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.qsofa.risk === 'normal' ? '0.0%' : riskScores.qsofa.risk === 'warning' ? '+2.3%' : '+15.6%'}
        </div>
        <div className="w-[200px] flex items-center max-md:w-[160px]">
          {riskScores.qsofa.description}
        </div>
        <div className="w-[150px] flex items-center max-md:w-[120px]">
          Normal: 0
        </div>
        <div className="w-[120px] flex items-center justify-center max-md:w-[100px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/6edec5d6-e840-4f8c-b946-a846307005c3?placeholderIfAbsent=true"
            alt="qSOFA trend chart"
            className="aspect-[1.75] object-contain w-[82px]"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-[7px] border-[rgba(67,69,75,1)]" />
      
      {/* Pulse Pressure - Volume status indicator */}
      <div className={`border flex items-center text-base font-normal mt-2.5 px-2.5 py-[8px] rounded-[30px] max-md:px-0 ${getRiskColor(riskScores.pulsePressure.risk)}`}>
        <div className="w-[200px] flex items-center gap-1.5 max-md:w-[160px]">
          <div className="w-4 h-4 bg-purple-500 rounded-full shrink-0"></div>
          <div>Pulse Pressure - Volume status indicator</div>
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.pulsePressure.value}
        </div>
        <div className="w-[100px] flex items-center max-md:w-[80px]">
          {riskScores.pulsePressure.risk === 'normal' ? '+0.0%' : riskScores.pulsePressure.risk === 'warning' ? '+4.2%' : '+9.1%'}
        </div>
        <div className="w-[200px] flex items-center max-md:w-[160px]">
          {riskScores.pulsePressure.description}
        </div>
        <div className="w-[150px] flex items-center max-md:w-[120px]">
          Normal: 40-60
        </div>
        <div className="w-[120px] flex items-center justify-center max-md:w-[100px]">
          <img
            src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/88dd884878c7d9e236192813b06f58b853f6d0f3?placeholderIfAbsent=true"
            alt="Pulse Pressure trend chart"
            className="aspect-[1.74] object-contain w-20"
          />
        </div>
      </div>
      <div className="w-[1270px] shrink-0 max-w-full h-0 mt-1 border-[rgba(67,69,75,1)]" />
    </section>
  );
};
