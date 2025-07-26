import { NextRequest, NextResponse } from 'next/server';
import { getVolumetricaClient } from '@/lib/volumetrica/client';
import type { TradingRule, RiskParameter, RiskAction, RiskValueSelection, RiskAnchor } from '@/types/volumetrica';
import { z } from 'zod';

// Risk parameter validation schema
const riskParameterSchema = z.object({
  enabled: z.boolean(),
  action: z.nativeEnum(RiskAction),
  value: z.number().optional(),
  percentage: z.number().min(0).max(100).optional(),
  selection: z.nativeEnum(RiskValueSelection).optional(),
  anchor: z.nativeEnum(RiskAnchor).optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true;
    // If enabled, must have either value or percentage based on selection
    if (data.selection === RiskValueSelection.Value) return data.value !== undefined;
    if (data.selection === RiskValueSelection.Percentage) return data.percentage !== undefined;
    if (data.selection === RiskValueSelection.Both) return data.value !== undefined && data.percentage !== undefined;
    // Default case - at least one should be present
    return data.value !== undefined || data.percentage !== undefined;
  },
  {
    message: 'Risk parameter must have appropriate value/percentage based on selection type',
  }
);

// Trading rule update schema
const updateTradingRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  groupUniverseId: z.string().uuid().optional(),
  maxDrawdown: riskParameterSchema.optional(),
  runup: riskParameterSchema.optional(),
  intradayDrawdown: riskParameterSchema.optional(),
  intradayRunup: riskParameterSchema.optional(),
  maxPositionLoss: riskParameterSchema.optional(),
  maxPositionGain: riskParameterSchema.optional(),
  maxPortfolioLoss: riskParameterSchema.optional(),
  maxPortfolioGain: riskParameterSchema.optional(),
  maxDailyTrades: z.number().int().min(0).max(1000).optional(),
  minSessionNumbers: z.number().int().min(0).max(365).optional(),
  overnightAllowed: z.boolean().optional(),
  overweekAllowed: z.boolean().optional(),
});

// GET handler - retrieve specific trading rule
export async function GET(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const ruleId = params.ruleId;

    if (!ruleId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Trading rule ID is required',
        },
        { status: 400 }
      );
    }

    // Get the Volumetrica client
    const client = getVolumetricaClient();

    // Fetch the trading rule
    const tradingRule = await client.get<TradingRule>(`/tradingRule/${ruleId}`);

    // Return the trading rule
    return NextResponse.json({
      success: true,
      data: tradingRule,
    });
  } catch (error: any) {
    console.error('Error fetching trading rule:', error);

    // Check if it's a Volumetrica API error
    if (error.name === 'VolumetricaError') {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          details: error.details || [],
        },
        { status: error.statusCode || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch trading rule',
        details: [error.message],
      },
      { status: 500 }
    );
  }
}

// PUT handler - update specific trading rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const ruleId = params.ruleId;

    if (!ruleId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Trading rule ID is required',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Add the ruleId to the body for validation
    const dataToValidate = { ...body, id: ruleId };

    // Validate the request body
    const validationResult = updateTradingRuleSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid trading rule data',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const tradingRuleData = validationResult.data;

    // Additional business logic validation
    const validationErrors: string[] = [];

    // Validate drawdown settings
    if (tradingRuleData.maxDrawdown?.enabled && tradingRuleData.intradayDrawdown?.enabled) {
      if (tradingRuleData.maxDrawdown.percentage && tradingRuleData.intradayDrawdown.percentage) {
        if (tradingRuleData.intradayDrawdown.percentage > tradingRuleData.maxDrawdown.percentage) {
          validationErrors.push('Intraday drawdown percentage cannot be greater than maximum drawdown percentage');
        }
      }
    }

    // Validate runup settings
    if (tradingRuleData.runup?.enabled && tradingRuleData.intradayRunup?.enabled) {
      if (tradingRuleData.runup.percentage && tradingRuleData.intradayRunup.percentage) {
        if (tradingRuleData.intradayRunup.percentage > tradingRuleData.runup.percentage) {
          validationErrors.push('Intraday runup percentage cannot be greater than maximum runup percentage');
        }
      }
    }

    // Validate position limits vs portfolio limits
    if (tradingRuleData.maxPositionLoss?.enabled && tradingRuleData.maxPortfolioLoss?.enabled) {
      if (tradingRuleData.maxPositionLoss.percentage && tradingRuleData.maxPortfolioLoss.percentage) {
        if (tradingRuleData.maxPositionLoss.percentage > tradingRuleData.maxPortfolioLoss.percentage) {
          validationErrors.push('Maximum position loss cannot be greater than maximum portfolio loss');
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Trading rule validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Get the Volumetrica client
    const client = getVolumetricaClient();

    // Update the trading rule - the API uses POST for updates
    await client.post('/tradingRule', tradingRuleData);

    // Return success response
    return NextResponse.json({
      success: true,
      data: tradingRuleData,
      message: 'Trading rule updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating trading rule:', error);

    // Check if it's a Volumetrica API error
    if (error.name === 'VolumetricaError') {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          details: error.details || [],
        },
        { status: error.statusCode || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update trading rule',
        details: [error.message],
      },
      { status: 500 }
    );
  }
}