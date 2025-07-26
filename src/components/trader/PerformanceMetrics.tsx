'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatPercentage, getPnLColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';

interface PerformanceData {
  date: string;
  balance: number;
  pnl: number;
}

interface PerformanceMetricsProps {
  data?: PerformanceData[];
  metrics?: {
    winRate: number;
    averageTrade: number;
    bestDay: { date: string; pnl: number };
    worstDay: { date: string; pnl: number };
    totalTrades: number;
    profitFactor: number;
  };
  isLoading?: boolean;
  currency?: 'USD' | 'EUR';
}

export function PerformanceMetrics({ 
  data = [], 
  metrics, 
  isLoading, 
  currency = 'USD' 
}: PerformanceMetricsProps) {
  
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const defaultMetrics = {
    winRate: 0,
    averageTrade: 0,
    bestDay: { date: 'N/A', pnl: 0 },
    worstDay: { date: 'N/A', pnl: 0 },
    totalTrades: 0,
    profitFactor: 0,
  };

  const displayMetrics = metrics || defaultMetrics;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm">
            Balance: {formatCurrency(payload[0].value, currency)}
          </p>
          {payload[1] && (
            <p className={`text-sm ${getPnLColor(payload[1].value)}`}>
              P&L: {formatPercentage(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Win Rate</span>
            </div>
            <p className={`text-xl font-semibold ${getPnLColor(displayMetrics.winRate - 50)}`}>
              {displayMetrics.winRate.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Trade</span>
            </div>
            <p className={`text-xl font-semibold ${getPnLColor(displayMetrics.averageTrade)}`}>
              {formatCurrency(displayMetrics.averageTrade, currency)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Best Day</span>
            </div>
            <p className="text-xl font-semibold text-green-600">
              {formatCurrency(displayMetrics.bestDay.pnl, currency)}
            </p>
            <p className="text-xs text-muted-foreground">{displayMetrics.bestDay.date}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Worst Day</span>
            </div>
            <p className="text-xl font-semibold text-red-600">
              {formatCurrency(displayMetrics.worstDay.pnl, currency)}
            </p>
            <p className="text-xs text-muted-foreground">{displayMetrics.worstDay.date}</p>
          </div>
        </div>

        {/* P&L Chart */}
        {data.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Balance Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => formatCurrency(value, currency).replace(/\.\d+/, '')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Total Trades</span>
            <p className="text-lg font-semibold">{displayMetrics.totalTrades}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Profit Factor</span>
            <p className={`text-lg font-semibold ${getPnLColor(displayMetrics.profitFactor - 1)}`}>
              {displayMetrics.profitFactor.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}