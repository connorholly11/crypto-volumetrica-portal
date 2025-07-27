import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVolumetricaClient } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import { checkRateLimit } from '@/lib/rate-limit';
import type { 
  CreateAccountRequest, 
  CreateAccountResponse,
  TradingRule,
  RiskParameter
} from '@/types/volumetrica';

import {
  Currency,
  AccountMode,
  PortfolioMode,
  ExpirationMode,
  Platform,
  VolumetricaPlatform,
  RiskAction,
  RiskValueSelection,
  RiskAnchor
} from '@/types/volumetrica';

// Validation schema for risk parameters
const RiskParameterSchema = z.object({
  enabled: z.boolean(),
  action: z.nativeEnum(RiskAction),
  value: z.number().optional(),
  percentage: z.number().optional(),
  selection: z.nativeEnum(RiskValueSelection).optional(),
  anchor: z.nativeEnum(RiskAnchor).optional(),
});

// Validation schema for trading rules
const TradingRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  groupUniverseId: z.string().optional(),
  maxDrawdown: RiskParameterSchema.optional(),
  runup: RiskParameterSchema.optional(),
  intradayDrawdown: RiskParameterSchema.optional(),
  intradayRunup: RiskParameterSchema.optional(),
  maxPositionLoss: RiskParameterSchema.optional(),
  maxPositionGain: RiskParameterSchema.optional(),
  maxPortfolioLoss: RiskParameterSchema.optional(),
  maxPortfolioGain: RiskParameterSchema.optional(),
  maxDailyTrades: z.number().optional(),
  minSessionNumbers: z.number().optional(),
  overnightAllowed: z.boolean().optional(),
  overweekAllowed: z.boolean().optional(),
});

// Validation schema for subscription details
const SubscriptionDetailSchema = z.object({
  dataFeedProducts: z.array(z.number()),
  platform: z.nativeEnum(Platform),
  volumetricaPlatform: z.nativeEnum(VolumetricaPlatform).optional(),
});

// Main validation schema for create account request
const CreateAccountSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  currency: z.nativeEnum(Currency),
  mode: z.nativeEnum(AccountMode),
  balance: z.number().positive('Balance must be positive'),
  portfolioMode: z.nativeEnum(PortfolioMode).optional(),
  header: z.string().optional(),
  description: z.string().optional(),
  disableOtherAccountsEnabled: z.boolean().optional(),
  expirationMode: z.nativeEnum(ExpirationMode).optional(),
  endDate: z.string().datetime().optional(),
  expirationDays: z.number().positive().optional(),
  accountRuleId: z.string().optional(),
  accountCustomRule: TradingRuleSchema.optional(),
  subscriptionDetail: SubscriptionDetailSchema.optional(),
}).refine((data) => {
  // Validate expiration mode logic
  if (data.expirationMode === ExpirationMode.UseEndDate && !data.endDate) {
    return false;
  }
  if ((data.expirationMode === ExpirationMode.DaysFromActivation || 
       data.expirationMode === ExpirationMode.DaysFromFirstOrder ||
       data.expirationMode === ExpirationMode.DaysFromFirstExecution) && 
      !data.expirationDays) {
    return false;
  }
  // Must have either accountRuleId or accountCustomRule, not both
  if ((data.accountRuleId && data.accountCustomRule) || 
      (!data.accountRuleId && !data.accountCustomRule)) {
    return false;
  }
  return true;
}, {
  message: 'Invalid expiration configuration or trading rule configuration'
});

export async function POST(request: NextRequest) {
  console.log('[Account Create] Request received');
  
  try {
    // Check rate limit first
    const { success, headers } = await checkRateLimit(request);
    if (!success) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers 
      });
    }
    
    // Parse request body
    const body = await request.json();
    console.log('[Account Create] Request body:', JSON.stringify(body, null, 2));
    
    // Validate request body
    const validatedData = CreateAccountSchema.parse(body);
    console.log('[Account Create] Validation passed');
    
    // Prepare request data - clean up empty values
    const requestData: any = {
      ...validatedData,
    };
    
    // If using a trading rule, remove currency (it's inherited from the rule)
    if (requestData.accountRuleId) {
      delete requestData.currency;
    }
    
    // Remove empty string values
    if (requestData.header === '') delete requestData.header;
    if (requestData.description === '') delete requestData.description;
    
    console.log('[Account Create] Sending to Volumetrica:', JSON.stringify(requestData, null, 2));
    
    // Create the account using the Volumetrica client
    const client = getVolumetricaClient();
    const response = await client.post<CreateAccountResponse>(
      '/tradingAccount',
      requestData
    );
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: response,
      message: 'Trading account created successfully'
    }, { 
      status: 201,
      headers 
    });
    
  } catch (error) {
    console.error('[Account Create] Error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.log('[Account Create] Validation error:', error.issues);
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        details: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
    }
    
    // Handle Volumetrica API errors
    if (error instanceof VolumetricaError) {
      console.log('[Account Create] Volumetrica error:', error.message, error.details);
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error creating account:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while creating the account'
    }, { status: 500 });
  }
}