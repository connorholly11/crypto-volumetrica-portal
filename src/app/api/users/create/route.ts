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
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = createUserSchema.parse(body);
    
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
    
    // Call Volumetrica API to create user
    const result = await volumetricaApi.users.create(createUserRequest) as CreateUserResponse;
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      message: 'User created successfully'
    }, { status: 201 });
    
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
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
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error creating user:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while creating the user'
    }, { status: 500 });
  }
}