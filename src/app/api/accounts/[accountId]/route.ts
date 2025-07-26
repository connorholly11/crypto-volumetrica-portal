import { NextRequest, NextResponse } from 'next/server';
import { getVolumetricaClient } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import type { TradingAccount } from '@/types/volumetrica';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    // Get accountId from params
    const { accountId } = await params;
    
    // Validate accountId
    if (!accountId || typeof accountId !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Invalid account ID'
      }, { status: 400 });
    }
    
    // Get the account data using the Volumetrica client
    const client = getVolumetricaClient();
    const account = await client.get<TradingAccount>(`/tradingAccount/${accountId}`);
    
    // Return success response with real-time account data
    return NextResponse.json({
      success: true,
      data: {
        // Basic account information
        accountId: account.accountId,
        userId: account.userId,
        header: account.header,
        description: account.description,
        currency: account.currency,
        mode: account.mode,
        portfolioMode: account.portfolioMode,
        status: account.status,
        
        // Real-time balance and equity data
        balance: account.balance,
        equity: account.equity,
        usedMargin: account.usedMargin,
        freeMargin: account.freeMargin,
        marginLevel: account.marginLevel,
        
        // P&L data
        unrealizedPnL: account.unrealizedPnL,
        realizedPnL: account.realizedPnL,
        dailyPnL: account.dailyPnL,
        weeklyPnL: account.weeklyPnL,
        monthlyPnL: account.monthlyPnL,
        
        // Risk metrics
        drawdown: account.drawdown,
        maxDrawdown: account.maxDrawdown,
        runup: account.runup,
        
        // Trading information
        openPositions: account.openPositions,
        tradingRuleId: account.tradingRuleId,
        
        // Dates
        createdAt: account.createdAt,
        enabledAt: account.enabledAt,
        expirationDate: account.expirationDate,
        
        // Disable reason if account is disabled
        reason: account.reason
      },
      message: 'Account data retrieved successfully'
    });
    
  } catch (error) {
    // Handle Volumetrica API errors
    if (error instanceof VolumetricaError) {
      // Handle specific not found error
      if (error.statusCode === 404) {
        return NextResponse.json({
          success: false,
          message: 'Account not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error fetching account:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while fetching account data'
    }, { status: 500 });
  }
}