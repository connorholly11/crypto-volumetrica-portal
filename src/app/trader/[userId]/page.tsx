'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { AccountOverviewCard } from '@/components/trader/AccountOverviewCard';
import { PerformanceMetrics } from '@/components/trader/PerformanceMetrics';
import { TradingRulesDisplay } from '@/components/trader/TradingRulesDisplay';
import { DrawdownProgress } from '@/components/trader/DrawdownProgress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { TradingAccount, TradingRule } from '@/types/volumetrica';

// Mock performance data generator
function generateMockPerformanceData(balance: number): any[] {
  const data = [];
  const days = 30;
  let currentBalance = balance * 0.95; // Start at 95% of current
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Random daily change between -2% and +3%
    const change = (Math.random() * 5 - 2) / 100;
    currentBalance = currentBalance * (1 + change);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: Math.round(currentBalance),
      pnl: ((currentBalance - balance) / balance) * 100
    });
  }
  
  return data;
}

// Calculate mock performance metrics
function calculateMockMetrics(data: any[]) {
  const trades = Math.floor(Math.random() * 50) + 20;
  const winRate = Math.random() * 30 + 45; // 45-75%
  
  const dailyPnLs = data.slice(1).map((d, i) => d.balance - data[i].balance);
  const bestDay = Math.max(...dailyPnLs);
  const worstDay = Math.min(...dailyPnLs);
  
  return {
    winRate,
    averageTrade: (Math.random() * 500 - 100), // -$100 to $400
    bestDay: {
      date: data[dailyPnLs.indexOf(bestDay) + 1]?.date || 'N/A',
      pnl: bestDay
    },
    worstDay: {
      date: data[dailyPnLs.indexOf(worstDay) + 1]?.date || 'N/A',
      pnl: worstDay
    },
    totalTrades: trades,
    profitFactor: winRate > 50 ? 1 + (winRate - 50) / 50 : winRate / 50
  };
}

export default function TraderDashboard() {
  const params = useParams();
  const userId = params.userId as string;

  // Fetch user data
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch accounts for this user
  const { 
    data: accountsData, 
    isLoading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/list?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      return data.data;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Get the first active account (in real app, might have account selector)
  const activeAccount = accountsData?.items?.find(
    (acc: TradingAccount) => acc.status === 1 // Enabled status
  ) || accountsData?.items?.[0];

  // Fetch trading rules for the account
  const { data: tradingRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['trading-rules', activeAccount?.tradingRuleId],
    queryFn: async () => {
      if (!activeAccount?.tradingRuleId) return null;
      const res = await fetch(`/api/trading-rules/${activeAccount.tradingRuleId}`);
      if (!res.ok) throw new Error('Failed to fetch trading rules');
      const data = await res.json();
      return data.data;
    },
    enabled: !!activeAccount?.tradingRuleId,
  });

  // Generate mock performance data based on account balance
  const performanceData = activeAccount 
    ? generateMockPerformanceData(activeAccount.balance) 
    : [];
  
  const performanceMetrics = performanceData.length > 0 
    ? calculateMockMetrics(performanceData)
    : undefined;

  // Calculate current metrics for rules display
  const currentMetrics = activeAccount ? {
    balance: activeAccount.balance,
    drawdown: activeAccount.drawdown,
    intradayDrawdown: Math.abs(activeAccount.dailyPnL / activeAccount.balance) * 100,
    runup: activeAccount.runup,
    dailyTrades: Math.floor(Math.random() * 10), // Mock daily trades
  } : undefined;

  const isLoading = userLoading || accountsLoading || rulesLoading;
  const error = userError || accountsError;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'An error occurred while loading the dashboard'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trader Dashboard</h1>
          {userData && (
            <p className="text-muted-foreground mt-1">
              Welcome back, {userData.firstName} {userData.lastName}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchAccounts()}
          disabled={accountsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${accountsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!activeAccount && !isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active trading accounts found. Please contact support to set up your account.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Grid */}
      {(activeAccount || isLoading) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Account Overview & Drawdown */}
          <div className="lg:col-span-1 space-y-6">
            <AccountOverviewCard 
              account={activeAccount} 
              isLoading={isLoading} 
            />
            
            <DrawdownProgress
              currentDrawdown={activeAccount?.drawdown || 0}
              maxDrawdown={tradingRules?.maxDrawdown?.percentage || 10}
              dailyDrawdown={currentMetrics?.intradayDrawdown}
              maxDailyDrawdown={tradingRules?.intradayDrawdown?.percentage || 5}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Performance & Rules */}
          <div className="lg:col-span-2 space-y-6">
            <PerformanceMetrics
              data={performanceData}
              metrics={performanceMetrics}
              currency={activeAccount?.currency === 0 ? 'EUR' : 'USD'}
              isLoading={isLoading}
            />
            
            <TradingRulesDisplay
              rules={tradingRules}
              currentMetrics={currentMetrics}
              currency={activeAccount?.currency === 0 ? 'EUR' : 'USD'}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Additional Information */}
      {activeAccount && (
        <div className="grid gap-4 md:grid-cols-3 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Account Type</p>
            <p className="text-lg font-semibold capitalize">
              {activeAccount.mode === 0 ? 'Evaluation' : 
               activeAccount.mode === 1 ? 'Sim Funded' :
               activeAccount.mode === 2 ? 'Funded' : 'Live'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-lg font-semibold">
              {new Date(activeAccount.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Platform</p>
            <p className="text-lg font-semibold">Volumetrica Trading</p>
          </div>
        </div>
      )}
    </div>
  );
}