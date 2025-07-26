import { NextRequest, NextResponse } from 'next/server';
import { TradingRule, RiskAction, RiskValueSelection, RiskAnchor } from '@/types/volumetrica';

// Pre-configured trading rule templates
const tradingRuleTemplates: TradingRule[] = [
  {
    id: 'template-100k-standard',
    name: '$100K Standard Challenge',
    description: 'Standard evaluation challenge with 10% profit target, 5% daily loss limit, and 10% maximum drawdown',
    maxDrawdown: {
      enabled: true,
      action: RiskAction.ChallengeFail,
      percentage: 10,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    intradayDrawdown: {
      enabled: true,
      action: RiskAction.IntradayDisable,
      percentage: 5,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    runup: {
      enabled: true,
      action: RiskAction.ChallengeSuccess,
      percentage: 10,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPositionLoss: {
      enabled: true,
      action: RiskAction.Flat,
      percentage: 2,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxDailyTrades: 20,
    minSessionNumbers: 5,
    overnightAllowed: true,
    overweekAllowed: true,
  },
  {
    id: 'template-50k-aggressive',
    name: '$50K Aggressive Challenge',
    description: 'Aggressive evaluation with 8% profit target, 4% daily loss limit, and 8% maximum drawdown',
    maxDrawdown: {
      enabled: true,
      action: RiskAction.ChallengeFail,
      percentage: 8,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    intradayDrawdown: {
      enabled: true,
      action: RiskAction.IntradayDisable,
      percentage: 4,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    runup: {
      enabled: true,
      action: RiskAction.ChallengeSuccess,
      percentage: 8,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPositionLoss: {
      enabled: true,
      action: RiskAction.Flat,
      percentage: 1.5,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPositionGain: {
      enabled: true,
      action: RiskAction.Flat,
      percentage: 3,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxDailyTrades: 30,
    minSessionNumbers: 3,
    overnightAllowed: true,
    overweekAllowed: false,
  },
  {
    id: 'template-200k-conservative',
    name: '$200K Conservative Challenge',
    description: 'Conservative evaluation with 10% profit target, 5% daily loss limit, and 12% maximum drawdown',
    maxDrawdown: {
      enabled: true,
      action: RiskAction.ChallengeFail,
      percentage: 12,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    intradayDrawdown: {
      enabled: true,
      action: RiskAction.IntradayDisable,
      percentage: 5,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    runup: {
      enabled: true,
      action: RiskAction.ChallengeSuccess,
      percentage: 10,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPositionLoss: {
      enabled: true,
      action: RiskAction.Flat,
      percentage: 2.5,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPortfolioLoss: {
      enabled: true,
      action: RiskAction.IntradayDisable,
      percentage: 4,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxDailyTrades: 15,
    minSessionNumbers: 10,
    overnightAllowed: true,
    overweekAllowed: true,
  },
  {
    id: 'template-25k-beginner',
    name: '$25K Beginner Challenge',
    description: 'Beginner-friendly evaluation with 6% profit target, 3% daily loss limit, and 6% maximum drawdown',
    maxDrawdown: {
      enabled: true,
      action: RiskAction.ChallengeFail,
      percentage: 6,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    intradayDrawdown: {
      enabled: true,
      action: RiskAction.IntradayDisable,
      percentage: 3,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    runup: {
      enabled: true,
      action: RiskAction.ChallengeSuccess,
      percentage: 6,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPositionLoss: {
      enabled: true,
      action: RiskAction.Flat,
      percentage: 1,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxDailyTrades: 10,
    minSessionNumbers: 5,
    overnightAllowed: false,
    overweekAllowed: false,
  },
  {
    id: 'template-500k-professional',
    name: '$500K Professional Challenge',
    description: 'Professional trader evaluation with 15% profit target, 5% daily loss limit, and 15% maximum drawdown',
    maxDrawdown: {
      enabled: true,
      action: RiskAction.ChallengeFail,
      percentage: 15,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    intradayDrawdown: {
      enabled: true,
      action: RiskAction.IntradayDisable,
      percentage: 5,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    runup: {
      enabled: true,
      action: RiskAction.ChallengeSuccess,
      percentage: 15,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPositionLoss: {
      enabled: true,
      action: RiskAction.Flat,
      percentage: 3,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxPortfolioLoss: {
      enabled: true,
      action: RiskAction.IntradayDisable,
      percentage: 4.5,
      selection: RiskValueSelection.Percentage,
      anchor: RiskAnchor.Balance,
    },
    maxDailyTrades: 50,
    minSessionNumbers: 20,
    overnightAllowed: true,
    overweekAllowed: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    // Optional: filter templates by query parameters
    const { searchParams } = new URL(request.url);
    const accountSize = searchParams.get('accountSize');
    const riskLevel = searchParams.get('riskLevel'); // conservative, standard, aggressive

    let filteredTemplates = tradingRuleTemplates;

    // Filter by account size if provided
    if (accountSize) {
      const size = accountSize.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(size)
      );
    }

    // Filter by risk level if provided
    if (riskLevel) {
      const level = riskLevel.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => {
        const name = template.name.toLowerCase();
        const description = template.description?.toLowerCase() || '';
        return name.includes(level) || description.includes(level);
      });
    }

    // Return the templates
    return NextResponse.json({
      success: true,
      data: {
        templates: filteredTemplates,
        totalCount: filteredTemplates.length,
      },
      message: 'Trading rule templates retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching trading rule templates:', error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch trading rule templates',
        details: [error.message],
      },
      { status: 500 }
    );
  }
}