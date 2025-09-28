import React, { useMemo } from 'react';
import { useVitals } from '@/hooks/useVitals';
import { calculateRiskScores } from '@/utils/riskCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LiveRiskScoresProps {
  bedId: string;
}

export const LiveRiskScores: React.FC<LiveRiskScoresProps> = ({ bedId }) => {
  const { getLatestVitals, loading } = useVitals(bedId);
  
  const riskScores = useMemo(() => {
    const latestVitals = getLatestVitals();
    if (!latestVitals) return null;
    return calculateRiskScores(latestVitals);
  }, [getLatestVitals]);

  if (loading || !riskScores) {
    return (
      <Card className="bg-black border-border">
        <CardHeader>
          <CardTitle className="text-white">Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading risk scores...</div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: 'normal' | 'warning' | 'critical') => {
    switch (risk) {
      case 'normal': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20 animate-pulse';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getRiskIcon = (risk: 'normal' | 'warning' | 'critical') => {
    switch (risk) {
      case 'normal': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '🚨';
      default: return '?';
    }
  };

  const criticalScores = Object.entries(riskScores).filter(([_, score]) => score.risk === 'critical');
  const warningScores = Object.entries(riskScores).filter(([_, score]) => score.risk === 'warning');

  return (
    <div className="space-y-4">
      {/* Critical Alert Banner */}
      {criticalScores.length > 0 && (
        <div className="bg-red-900/20 border border-red-400/30 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-red-400 text-xl">🚨</div>
            <h3 className="text-red-400 font-semibold text-lg">Critical Risk Alert</h3>
          </div>
          <div className="text-red-300 text-sm">
            Immediate clinical assessment required for {criticalScores.length} risk factor{criticalScores.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Main Risk Scores Grid */}
      <Card className="bg-black border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">Live Risk Assessment</CardTitle>
            <div className="flex gap-2">
              {criticalScores.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {criticalScores.length} Critical
                </Badge>
              )}
              {warningScores.length > 0 && (
                <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
                  {warningScores.length} Warning
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Shock Index */}
            <div className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              getRiskColor(riskScores.shockIndex.risk)
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">Shock Index</div>
                <div className="text-lg">{getRiskIcon(riskScores.shockIndex.risk)}</div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {riskScores.shockIndex.value.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Normal: 0.5-0.7
              </div>
              <div className="text-sm">
                {riskScores.shockIndex.description}
              </div>
            </div>

            {/* PEWS Score */}
            <div className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              getRiskColor(riskScores.pewsScore.risk)
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">PEWS Score</div>
                <div className="text-lg">{getRiskIcon(riskScores.pewsScore.risk)}</div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {riskScores.pewsScore.value}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Normal: 0-2
              </div>
              <div className="text-sm">
                {riskScores.pewsScore.description}
              </div>
            </div>

            {/* MAP */}
            <div className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              getRiskColor(riskScores.map.risk)
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">MAP</div>
                <div className="text-lg">{getRiskIcon(riskScores.map.risk)}</div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {riskScores.map.value.toFixed(0)}
                <span className="text-sm text-muted-foreground ml-1">mmHg</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Normal: 70-100 mmHg
              </div>
              <div className="text-sm">
                {riskScores.map.description}
              </div>
            </div>

            {/* ROX Index */}
            <div className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              getRiskColor(riskScores.roxIndex.risk)
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">ROX Index</div>
                <div className="text-lg">{getRiskIcon(riskScores.roxIndex.risk)}</div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {riskScores.roxIndex.value.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Normal: &gt;4.88
              </div>
              <div className="text-sm">
                {riskScores.roxIndex.description}
              </div>
            </div>

            {/* qSOFA */}
            <div className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              getRiskColor(riskScores.qsofa.risk)
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">qSOFA</div>
                <div className="text-lg">{getRiskIcon(riskScores.qsofa.risk)}</div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {riskScores.qsofa.value}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Normal: 0-1
              </div>
              <div className="text-sm">
                {riskScores.qsofa.description}
              </div>
            </div>

            {/* Pulse Pressure */}
            <div className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              getRiskColor(riskScores.pulsePressure.risk)
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-muted-foreground">Pulse Pressure</div>
                <div className="text-lg">{getRiskIcon(riskScores.pulsePressure.risk)}</div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {riskScores.pulsePressure.value}
                <span className="text-sm text-muted-foreground ml-1">mmHg</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Normal: 30-50 mmHg
              </div>
              <div className="text-sm">
                {riskScores.pulsePressure.description}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Summary */}
      <Card className="bg-gradient-to-r from-background to-muted/10 border-border">
        <CardContent className="pt-6">
          <h4 className="text-white font-semibold mb-3">Clinical Summary</h4>
          <div className="space-y-2">
            {criticalScores.length > 0 && (
              <div className="text-red-400 text-sm">
                • Immediate intervention required for critical risk factors
              </div>
            )}
            {warningScores.length > 0 && (
              <div className="text-yellow-400 text-sm">
                • Close monitoring recommended for {warningScores.length} warning indicator{warningScores.length > 1 ? 's' : ''}
              </div>
            )}
            {criticalScores.length === 0 && warningScores.length === 0 && (
              <div className="text-green-400 text-sm">
                • All risk factors within normal parameters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};