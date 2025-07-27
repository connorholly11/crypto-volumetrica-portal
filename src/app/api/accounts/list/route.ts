import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVolumetricaClient } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import { TradingAccount, AccountStatus } from '@/types/volumetrica';
import { requireAuth } from '@/lib/auth';

// Validation schema for query parameters
const ListAccountsSchema = z.object({
  userId: z.string().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'balance', 'equity', 'drawdown']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  console.log('[Accounts List] Request received');
  
  try {
    // Check authentication
    const userId = requireAuth();
    console.log('[Accounts List] Authenticated user:', userId);
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') || 'desc',
    };
    
    // Validate query parameters
    const validatedParams = ListAccountsSchema.parse(queryParams);
    
    // Build API query parameters
    const apiParams: Record<string, any> = {
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
      sortBy: validatedParams.sortBy,
      sortDirection: validatedParams.sortDirection,
    };
    
    if (validatedParams.userId) {
      apiParams.userId = validatedParams.userId;
    }
    
    if (validatedParams.status !== undefined) {
      apiParams.status = validatedParams.status;
    }
    
    // Get accounts list using the Volumetrica client
    const client = getVolumetricaClient();
    
    // Try to get accounts, handle 404 as empty list
    let response;
    try {
      console.log('[Accounts List] Calling Volumetrica with params:', apiParams);
      response = await client.get<any>('/tradingAccount', { params: apiParams });
      console.log('[Accounts List] Response received:', response);
    } catch (error: any) {
      console.log('[Accounts List] Error caught:', error.statusCode, error.message);
      // If 404, return empty list (no accounts yet)
      if (error.statusCode === 404) {
        console.log('[Accounts List] Handling 404 as empty list');
        response = {
          accounts: [],
          totalCount: 0,
          page: validatedParams.page,
          pageSize: validatedParams.pageSize,
          totalPages: 0
        };
      } else {
        throw error;
      }
    }
    
    // Handle different response formats from Volumetrica
    let accounts: TradingAccount[] = [];
    let totalCount = 0;
    
    if (Array.isArray(response)) {
      // Response is array of accounts
      accounts = response;
      totalCount = accounts.length;
    } else if (response.accounts) {
      // Response has accounts property
      accounts = response.accounts;
      totalCount = response.totalCount || accounts.length;
    } else if (response.items) {
      // Response has items property
      accounts = response.items;
      totalCount = response.totalCount || accounts.length;
    } else if (response.data) {
      // Response has data property
      if (Array.isArray(response.data)) {
        accounts = response.data;
        totalCount = accounts.length;
      } else if (response.data.accounts) {
        accounts = response.data.accounts;
        totalCount = response.data.totalCount || accounts.length;
      }
    }
    
    const totalPages = Math.ceil(totalCount / validatedParams.pageSize);
    const currentPage = validatedParams.page;
    
    // Calculate summary statistics
    const summaryStats = {
      totalAccounts: totalCount,
      activeAccounts: accounts.filter(a => a.status === AccountStatus.Enabled).length,
      totalEquity: accounts.reduce((sum, a) => sum + a.equity, 0),
      totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      totalUnrealizedPnL: accounts.reduce((sum, a) => sum + a.unrealizedPnL, 0),
      totalRealizedPnL: accounts.reduce((sum, a) => sum + a.realizedPnL, 0),
    };
    
    // Return success response with pagination and accounts
    return NextResponse.json({
      success: true,
      data: {
        accounts: accounts.map(account => ({
          accountId: account.accountId,
          userId: account.userId,
          header: account.header,
          description: account.description,
          currency: account.currency,
          mode: account.mode,
          portfolioMode: account.portfolioMode,
          status: account.status,
          balance: account.balance,
          equity: account.equity,
          usedMargin: account.usedMargin,
          freeMargin: account.freeMargin,
          marginLevel: account.marginLevel,
          unrealizedPnL: account.unrealizedPnL,
          realizedPnL: account.realizedPnL,
          dailyPnL: account.dailyPnL,
          drawdown: account.drawdown,
          maxDrawdown: account.maxDrawdown,
          openPositions: account.openPositions,
          tradingRuleId: account.tradingRuleId,
          createdAt: account.createdAt,
          enabledAt: account.enabledAt,
          expirationDate: account.expirationDate,
          reason: account.reason
        })),
        pagination: {
          totalCount: totalCount,
          page: currentPage,
          pageSize: validatedParams.pageSize,
          totalPages: totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
        summary: summaryStats
      },
      message: 'Accounts retrieved successfully'
    });
    
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid query parameters',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
    }
    
    // Handle Volumetrica API errors
    if (error instanceof VolumetricaError) {
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error listing accounts:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while listing accounts'
    }, { status: 500 });
  }
}