'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawdownProgressProps {
  currentDrawdown: number;
  maxDrawdown: number;
  dailyDrawdown?: number;
  maxDailyDrawdown?: number;
  isLoading?: boolean;
}

export function DrawdownProgress({
  currentDrawdown,
  maxDrawdown,
  dailyDrawdown,
  maxDailyDrawdown,
  isLoading
}: DrawdownProgressProps) {
  
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const drawdownPercentage = maxDrawdown > 0 ? (currentDrawdown / maxDrawdown) * 100 : 0;
  const dailyDrawdownPercentage = maxDailyDrawdown && dailyDrawdown 
    ? (dailyDrawdown / maxDailyDrawdown) * 100 
    : 0;

  const getRiskLevel = (percentage: number): 'safe' | 'caution' | 'warning' | 'danger' => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'caution';
    return 'safe';
  };

  const riskLevel = getRiskLevel(drawdownPercentage);
  const dailyRiskLevel = getRiskLevel(dailyDrawdownPercentage);

  const getRiskColor = (level: 'safe' | 'caution' | 'warning' | 'danger') => {
    switch (level) {
      case 'danger': return 'bg-red-600';
      case 'warning': return 'bg-orange-500';
      case 'caution': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getRiskIcon = (level: 'safe' | 'caution' | 'warning' | 'danger') => {
    switch (level) {
      case 'danger': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'caution': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getRiskMessage = (level: 'safe' | 'caution' | 'warning' | 'danger', percentage: number) => {
    switch (level) {
      case 'danger':
        return `Critical Risk! ${percentage.toFixed(1)}% of maximum drawdown reached. Account may be disabled.`;
      case 'warning':
        return `High Risk! ${percentage.toFixed(1)}% of maximum drawdown reached. Trade carefully.`;
      case 'caution':
        return `Moderate Risk. ${percentage.toFixed(1)}% of maximum drawdown reached.`;
      default:
        return `Risk level is acceptable. ${percentage.toFixed(1)}% of maximum drawdown.`;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Drawdown Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Drawdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getRiskIcon(riskLevel)}
              <span className="font-medium">Total Drawdown</span>
            </div>
            <span className={cn(
              "text-sm font-semibold",
              riskLevel === 'danger' && "text-red-600",
              riskLevel === 'warning' && "text-orange-500",
              riskLevel === 'caution' && "text-yellow-500",
              riskLevel === 'safe' && "text-green-500"
            )}>
              {currentDrawdown.toFixed(2)}% / {maxDrawdown.toFixed(2)}%
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={drawdownPercentage} 
              className="h-6"
              indicatorClassName={getRiskColor(riskLevel)}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white mix-blend-difference">
                {drawdownPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {riskLevel !== 'safe' && (
            <Alert 
              variant={riskLevel === 'danger' ? 'destructive' : 'default'}
              className="py-3"
            >
              <AlertDescription className="text-sm">
                {getRiskMessage(riskLevel, drawdownPercentage)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Daily Drawdown */}
        {maxDailyDrawdown && dailyDrawdown !== undefined && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRiskIcon(dailyRiskLevel)}
                <span className="font-medium">Daily Drawdown</span>
              </div>
              <span className={cn(
                "text-sm font-semibold",
                dailyRiskLevel === 'danger' && "text-red-600",
                dailyRiskLevel === 'warning' && "text-orange-500",
                dailyRiskLevel === 'caution' && "text-yellow-500",
                dailyRiskLevel === 'safe' && "text-green-500"
              )}>
                {dailyDrawdown.toFixed(2)}% / {maxDailyDrawdown.toFixed(2)}%
              </span>
            </div>
            
            <div className="relative">
              <Progress 
                value={dailyDrawdownPercentage} 
                className="h-6"
                indicatorClassName={getRiskColor(dailyRiskLevel)}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white mix-blend-difference">
                  {dailyDrawdownPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {dailyRiskLevel === 'danger' && (
              <Alert variant="destructive" className="py-3">
                <AlertDescription className="text-sm">
                  Daily loss limit nearly reached! Trading may be disabled for today.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Risk Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold">Risk Management Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Keep position sizes small when drawdown exceeds 50%</li>
            <li>• Consider reducing trading frequency at 75% drawdown</li>
            <li>• Stop trading immediately if approaching maximum limits</li>
            <li>• Focus on high-probability setups during recovery</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}