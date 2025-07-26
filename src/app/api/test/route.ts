import { NextRequest, NextResponse } from 'next/server';
import { volumetricaApi } from '@/lib/volumetrica/client';

export async function GET(request: NextRequest) {
  try {
    // Test basic API connectivity
    const tests = {
      apiUrl: process.env.VOLUMETRICA_API_URL,
      hasApiKey: !!process.env.VOLUMETRICA_API_KEY,
      apiKeyLength: process.env.VOLUMETRICA_API_KEY?.length,
    };

    // Try a simple request - get trading rules without params
    let tradingRulesTest = { success: false, error: null, data: null };
    try {
      const rules = await volumetricaApi.tradingRules.list();
      tradingRulesTest = { success: true, error: null, data: rules };
    } catch (error: any) {
      tradingRulesTest = { 
        success: false, 
        error: error.message || 'Unknown error',
        data: null 
      };
    }

    return NextResponse.json({
      success: true,
      tests,
      tradingRulesTest,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}