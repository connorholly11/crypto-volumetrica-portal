import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[Test User] Endpoint hit');
  
  try {
    // Test 1: Can we parse the body?
    let body;
    try {
      body = await request.json();
      console.log('[Test User] Body parsed successfully:', body);
    } catch (e: any) {
      console.error('[Test User] Failed to parse body:', e.message);
      return NextResponse.json({
        success: false,
        test: 'body-parse',
        error: e.message
      }, { status: 400 });
    }
    
    // Test 2: Check environment variables
    const envCheck = {
      hasApiUrl: !!process.env.VOLUMETRICA_API_URL,
      apiUrl: process.env.VOLUMETRICA_API_URL,
      hasApiKey: !!process.env.VOLUMETRICA_API_KEY,
      apiKeyPrefix: process.env.VOLUMETRICA_API_KEY?.substring(0, 10) + '...'
    };
    console.log('[Test User] Environment check:', envCheck);
    
    // Test 3: Simple response
    const response = {
      success: true,
      message: 'Test endpoint working',
      receivedData: body,
      envCheck,
      timestamp: new Date().toISOString()
    };
    
    console.log('[Test User] Sending response:', response);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('[Test User] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 });
  }
}