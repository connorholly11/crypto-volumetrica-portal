'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency, formatPercentage, getPnLColor, getStatusColor } from '@/lib/utils';
import { TradingAccount, AccountStatus } from '@/types/volumetrica';

interface AccountOverviewCardProps {
  account: TradingAccount | null;
  isLoading?: boolean;
}

export function AccountOverviewCard({ account, isLoading }: AccountOverviewCardProps) {
  if (isLoading || !account) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: AccountStatus) => {
    const statusLabels = {
      [AccountStatus.Initialized]: 'Initialized',
      [AccountStatus.Enabled]: 'Active',
      [AccountStatus.ChallengeSuccess]: 'Passed',
      [AccountStatus.ChallengeFailed]: 'Failed',
      [AccountStatus.Disabled]: 'Disabled',
    };

    const statusVariants = {
      [AccountStatus.Initialized]: 'secondary',
      [AccountStatus.Enabled]: 'default',
      [AccountStatus.ChallengeSuccess]: 'success',
      [AccountStatus.ChallengeFailed]: 'destructive',
      [AccountStatus.Disabled]: 'secondary',
    } as const;

    return (
      <Badge variant={statusVariants[status] || 'secondary'}>
        {statusLabels[status] || 'Unknown'}
      </Badge>
    );
  };

  const pnlPercentage = account.balance > 0 
    ? ((account.equity - account.balance) / account.balance) * 100 
    : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{account.header}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Account ID: {account.accountId.slice(0, 8)}...
          </p>
        </div>
        {getStatusBadge(account.status)}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Balance</span>
            </div>
            <span className="text-2xl font-bold">
              {formatCurrency(account.balance, account.currency === 0 ? 'EUR' : 'USD')}
            </span>
          </div>
        </div>

        {/* Equity and P&L */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Equity</span>
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(account.equity, account.currency === 0 ? 'EUR' : 'USD')}
            </p>
            <p className={`text-xs ${getPnLColor(pnlPercentage)}`}>
              {formatPercentage(pnlPercentage)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {account.unrealizedPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm text-muted-foreground">Unrealized P&L</span>
            </div>
            <p className={`text-lg font-semibold ${getPnLColor(account.unrealizedPnL)}`}>
              {formatCurrency(account.unrealizedPnL, account.currency === 0 ? 'EUR' : 'USD')}
            </p>
          </div>
        </div>

        {/* Trading Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Daily P&L</p>
            <p className={`text-sm font-semibold ${getPnLColor(account.dailyPnL)}`}>
              {formatCurrency(account.dailyPnL, account.currency === 0 ? 'EUR' : 'USD')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Open Positions</p>
            <p className="text-sm font-semibold">{account.openPositions}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Margin Level</p>
            <p className="text-sm font-semibold">
              {account.marginLevel > 0 ? `${account.marginLevel.toFixed(0)}%` : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}