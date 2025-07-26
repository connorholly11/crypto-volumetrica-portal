'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { TradingRule, RiskParameter, RiskAction } from '@/types/volumetrica';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';

interface TradingRulesDisplayProps {
  rules: TradingRule | null;
  currentMetrics?: {
    balance: number;
    drawdown: number;
    intradayDrawdown: number;
    runup: number;
    dailyTrades: number;
  };
  isLoading?: boolean;
  currency?: 'USD' | 'EUR';
}

export function TradingRulesDisplay({ 
  rules, 
  currentMetrics, 
  isLoading,
  currency = 'USD'
}: TradingRulesDisplayProps) {
  
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!rules) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Trading Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No trading rules configured</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskActionBadge = (action: RiskAction) => {
    const actionLabels = {
      [RiskAction.None]: 'Monitor Only',
      [RiskAction.ChallengeFail]: 'Challenge Fail',
      [RiskAction.Flat]: 'Flatten Positions',
      [RiskAction.IntradayDisable]: 'Disable Trading',
    };

    const actionVariants = {
      [RiskAction.None]: 'secondary',
      [RiskAction.ChallengeFail]: 'destructive',
      [RiskAction.Flat]: 'warning',
      [RiskAction.IntradayDisable]: 'warning',
    } as const;

    return (
      <Badge variant={actionVariants[action] || 'secondary'} className="text-xs">
        {actionLabels[action] || 'Unknown'}
      </Badge>
    );
  };

  const getRiskLevel = (current: number, limit: number): 'safe' | 'warning' | 'danger' => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'safe';
  };

  const getRiskProgressColor = (level: 'safe' | 'warning' | 'danger') => {
    switch (level) {
      case 'danger': return 'bg-red-600';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-green-500';
    }
  };

  const RuleProgress = ({ 
    label, 
    current, 
    limit, 
    isPercentage = false,
    showAlert = true 
  }: { 
    label: string; 
    current: number; 
    limit: number; 
    isPercentage?: boolean;
    showAlert?: boolean;
  }) => {
    const progress = Math.min((Math.abs(current) / Math.abs(limit)) * 100, 100);
    const riskLevel = getRiskLevel(Math.abs(current), Math.abs(limit));
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">
            {isPercentage ? (
              <>
                {formatPercentage(current, 2)} / {formatPercentage(limit, 2)}
              </>
            ) : (
              <>
                {formatCurrency(current, currency)} / {formatCurrency(limit, currency)}
              </>
            )}
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName={getRiskProgressColor(riskLevel)}
        />
        {showAlert && riskLevel !== 'safe' && (
          <Alert variant={riskLevel === 'danger' ? 'destructive' : 'default'} className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {riskLevel === 'danger' 
                ? `Critical: ${progress.toFixed(0)}% of limit reached`
                : `Warning: ${progress.toFixed(0)}% of limit reached`
              }
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{rules.name}</CardTitle>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
        {rules.description && (
          <p className="text-sm text-muted-foreground mt-1">{rules.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawdown Rules */}
        {rules.maxDrawdown?.enabled && currentMetrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Maximum Drawdown</h3>
              {getRiskActionBadge(rules.maxDrawdown.action)}
            </div>
            <RuleProgress
              label="Current Drawdown"
              current={currentMetrics.drawdown}
              limit={rules.maxDrawdown.percentage || 0}
              isPercentage={true}
            />
          </div>
        )}

        {/* Intraday Drawdown */}
        {rules.intradayDrawdown?.enabled && currentMetrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Daily Drawdown</h3>
              {getRiskActionBadge(rules.intradayDrawdown.action)}
            </div>
            <RuleProgress
              label="Current Daily Loss"
              current={currentMetrics.intradayDrawdown}
              limit={rules.intradayDrawdown.percentage || 0}
              isPercentage={true}
            />
          </div>
        )}

        {/* Profit Target / Runup */}
        {rules.runup?.enabled && currentMetrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Profit Target</h3>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <RuleProgress
              label="Current Progress"
              current={currentMetrics.runup}
              limit={rules.runup.percentage || 0}
              isPercentage={true}
              showAlert={false}
            />
          </div>
        )}

        {/* Trading Restrictions */}
        <div className="space-y-3 pt-3 border-t">
          <h3 className="text-sm font-semibold">Trading Restrictions</h3>
          <div className="space-y-2">
            {rules.maxDailyTrades && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Trade Limit</span>
                <span className="text-sm font-medium">
                  {currentMetrics?.dailyTrades || 0} / {rules.maxDailyTrades}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Overnight Trading</span>
              {rules.overnightAllowed ? (
                <Badge variant="success" className="text-xs">Allowed</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Not Allowed</Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Weekend Trading</span>
              {rules.overweekAllowed ? (
                <Badge variant="success" className="text-xs">Allowed</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Not Allowed</Badge>
              )}
            </div>

            {rules.minSessionNumbers && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Minimum Trading Days</span>
                <span className="text-sm font-medium">{rules.minSessionNumbers}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}