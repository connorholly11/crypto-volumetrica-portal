'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

interface TraderDashboardClientProps {
  userId: string;
}

export default function TraderDashboardClient({ userId }: TraderDashboardClientProps) {
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

  // Fetch accounts from the new cached API
  const { 
    data: accountsData, 
    isLoading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch accounts');
      }
      return res.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Get the first active account from cached data
  // Note: The new API returns a limited set of fields compared to the full TradingAccount type
  const accounts = accountsData?.accounts || [];
  const activeAccount = accounts.find(
    (acc: any) => acc.status === 1 // Enabled status
  ) || accounts[0];
  
  // Fetch full account details if we have an active account
  const { data: fullAccountData } = useQuery({
    queryKey: ['account-details', activeAccount?.accountId],
    queryFn: async () => {
      if (!activeAccount?.accountId) return null;
      // Still use the old API for full account details until a new endpoint is available
      const res = await fetch(`/api/accounts/list?userId=${accountsData?.user?.volumetricaId}`);
      if (!res.ok) throw new Error('Failed to fetch account details');
      const data = await res.json();
      return data.data?.accounts?.find((acc: TradingAccount) => acc.accountId === activeAccount.accountId);
    },
    enabled: !!activeAccount?.accountId && !!accountsData?.user?.volumetricaId,
  });
  
  // Use full account data if available, otherwise use limited cached data
  const accountForDisplay = fullAccountData || activeAccount;

  // Fetch trading rules for the account
  const { data: tradingRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['trading-rules', fullAccountData?.tradingRuleId],
    queryFn: async () => {
      if (!fullAccountData?.tradingRuleId) return null;
      const res = await fetch(`/api/trading-rules/${fullAccountData.tradingRuleId}`);
      if (!res.ok) throw new Error('Failed to fetch trading rules');
      const data = await res.json();
      return data.data;
    },
    enabled: !!fullAccountData?.tradingRuleId,
  });

  // Generate mock performance data based on account balance
  // Keep balance as string until final calculation to maintain precision
  const balanceStr = accountForDisplay?.balance || '0';
  const balance = parseFloat(balanceStr); // Only convert when needed for calculations
  const performanceData = accountForDisplay 
    ? generateMockPerformanceData(balance) 
    : [];
  
  const performanceMetrics = performanceData.length > 0 
    ? calculateMockMetrics(performanceData)
    : undefined;

  // Calculate current metrics for rules display
  const currentMetrics = fullAccountData ? {
    balance: fullAccountData.balance,
    drawdown: fullAccountData.drawdown,
    intradayDrawdown: Math.abs(fullAccountData.dailyPnL / fullAccountData.balance) * 100,
    runup: fullAccountData.runup,
    dailyTrades: Math.floor(Math.random() * 10), // Mock daily trades
  } : (accountForDisplay ? {
    balance: parseFloat(accountForDisplay.balance), // TODO: Use decimal.js for production
    drawdown: 0, // Not available in cached data
    intradayDrawdown: 0, // Not available in cached data
    runup: 0, // Not available in cached data
    dailyTrades: Math.floor(Math.random() * 10), // Mock daily trades
  } : undefined);

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

      {!accountForDisplay && !isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active trading accounts found. Please contact support to set up your account.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Grid */}
      {(accountForDisplay || isLoading) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Account Overview & Drawdown */}
          <div className="lg:col-span-1 space-y-6">
            <AccountOverviewCard 
              account={fullAccountData || (accountForDisplay ? {
                ...accountForDisplay,
                // Map cached fields to expected structure
                accountId: accountForDisplay.accountId,
                userId: accountsData?.user?.volumetricaId || '',
                header: 'Trading Account',
                balance: parseFloat(accountForDisplay.balance), // TODO: Use decimal.js for production
                currency: accountForDisplay.currency === 'EUR' ? 0 : 1,
                status: accountForDisplay.status,
                // Set defaults for fields not in cache
                equity: parseFloat(accountForDisplay.balance),
                usedMargin: 0,
                freeMargin: parseFloat(accountForDisplay.balance),
                marginLevel: 0,
                dailyPnL: 0,
                weeklyPnL: 0,
                monthlyPnL: 0,
                openPositions: 0,
                drawdown: 0,
                maxDrawdown: 0,
                runup: 0,
                unrealizedPnL: 0,
                realizedPnL: 0,
                mode: 0, // Default to evaluation
                portfolioMode: 0,
                createdAt: accountForDisplay.lastSync || new Date().toISOString(),
              } as TradingAccount : undefined)} 
              isLoading={isLoading} 
            />
            
            <DrawdownProgress
              currentDrawdown={fullAccountData?.drawdown || 0}
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
              currency={accountForDisplay?.currency === 'EUR' || accountForDisplay?.currency === 0 ? 'EUR' : 'USD'}
              isLoading={isLoading}
            />
            
            <TradingRulesDisplay
              rules={tradingRules}
              currentMetrics={currentMetrics}
              currency={accountForDisplay?.currency === 'EUR' || accountForDisplay?.currency === 0 ? 'EUR' : 'USD'}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Additional Information */}
      {accountForDisplay && (
        <div className="grid gap-4 md:grid-cols-3 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Account Type</p>
            <p className="text-lg font-semibold capitalize">
              {fullAccountData ? (
                fullAccountData.mode === 0 ? 'Evaluation' : 
                fullAccountData.mode === 1 ? 'Sim Funded' :
                fullAccountData.mode === 2 ? 'Funded' : 'Live'
              ) : 'Evaluation'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-lg font-semibold">
              {fullAccountData?.createdAt ? 
                new Date(fullAccountData.createdAt).toLocaleDateString() :
                new Date().toLocaleDateString()}
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