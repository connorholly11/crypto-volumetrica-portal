import { NextRequest, NextResponse } from 'next/server';
import { volumetricaApi } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import { z } from 'zod';
import type { CreateUserRequest, CreateUserResponse, UserManagementMode, EncryptionMode } from '@/types/volumetrica';

// Validation schema for create user request
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  country: z.string().length(2, 'Country must be a 2-letter code').toUpperCase(),
  state: z.string().length(2, 'State must be a 2-letter code').toUpperCase().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  encryptionMode: z.nativeEnum({
    None: 0,
    AES256: 1
  } as const).optional(),
  forceNewPassword: z.boolean().optional(),
  externalId: z.string().max(100, 'External ID too long').optional(),
});

export async function POST(request: NextRequest) {
  console.log('[User Create] Request received');
  
  try {
    // Parse request body
    let body;
    try {
      const contentType = request.headers.get('content-type');
      console.log('[User Create] Content-Type:', contentType);
      
      body = await request.json();
      console.log('[User Create] Request body:', JSON.stringify(body, null, 2));
    } catch (parseError: any) {
      console.error('[User Create] Failed to parse JSON:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON in request body',
        details: [parseError.message]
      }, { status: 400 });
    }
    
    // Validate input
    const validatedData = createUserSchema.parse(body);
    console.log('[User Create] Validation passed');
    
    // Create the user request object
    const createUserRequest: CreateUserRequest = {
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      country: validatedData.country,
      state: validatedData.state,
      phone: validatedData.phone,
      password: validatedData.password,
      encryptionMode: validatedData.encryptionMode,
      forceNewPassword: validatedData.forceNewPassword,
      externalId: validatedData.externalId,
    };
    
    // Log environment check
    console.log('[User Create] API URL:', process.env.VOLUMETRICA_API_URL);
    console.log('[User Create] Has API Key:', !!process.env.VOLUMETRICA_API_KEY);
    
    // Call Volumetrica API to create user
    console.log('[User Create] Calling Volumetrica API with:', createUserRequest);
    const result = await volumetricaApi.users.create(createUserRequest) as CreateUserResponse;
    console.log('[User Create] Volumetrica API response:', result);
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      message: 'User created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[User Create] Error caught:', error);
    console.error('[User Create] Error type:', error?.constructor?.name);
    console.error('[User Create] Error message:', error?.message);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.log('[User Create] Zod validation error');
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    
    // Handle Volumetrica API errors
    if (error instanceof VolumetricaError) {
      console.log('[User Create] Volumetrica API error');
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle other errors with error details
    console.error('[User Create] Unexpected error:', error);
    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorDetails = [];
    
    // Add more error context
    if (error?.response?.data) {
      errorDetails.push(`API Response: ${JSON.stringify(error.response.data)}`);
    }
    if (error?.stack) {
      console.error('[User Create] Stack trace:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      details: errorDetails.length > 0 ? errorDetails : ['An unexpected error occurred while creating the user']
    }, { status: 500 });
  }
}