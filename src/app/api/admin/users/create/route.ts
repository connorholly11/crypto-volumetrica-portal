import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { volumetricaApi, VolumetricaError } from '@/lib/volumetrica/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schema for admin user creation
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  country: z.string().length(2, 'Country must be a 2-letter code').toUpperCase(),
  state: z.union([
    z.string().length(2, 'State must be a 2-letter code').toUpperCase(),
    z.literal('')
  ]).optional(),
});

// Generate a temporary password
function generateTempPassword(): string {
  // Generate a secure temporary password
  // Format: Temp-XXXX-XXXX where X is alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomPart1 = Array.from(crypto.randomBytes(4))
    .map(byte => chars[byte % chars.length])
    .join('');
  const randomPart2 = Array.from(crypto.randomBytes(4))
    .map(byte => chars[byte % chars.length])
    .join('');
  
  return `Temp-${randomPart1}-${randomPart2}`;
}

export async function POST(request: NextRequest) {
  console.log('[Admin User Create] Request received');
  
  try {
    // Check rate limit first
    const { success, headers } = await checkRateLimit(request);
    if (!success) {
      console.log('[Admin User Create] Rate limit exceeded');
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers 
      });
    }
    
    // Check admin authorization
    await requireAdmin();
    console.log('[Admin User Create] Admin authorization verified');
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[Admin User Create] Request body:', JSON.stringify(body, null, 2));
    } catch (parseError: any) {
      console.error('[Admin User Create] Failed to parse JSON:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON in request body',
        details: [parseError.message]
      }, { status: 400 });
    }
    
    // Validate input
    const validatedData = createUserSchema.parse(body);
    console.log('[Admin User Create] Validation passed');
    
    const { firstName, lastName, email, country, state } = validatedData;
    const tempPassword = generateTempPassword();
    
    let clerkUser;
    let volumetricaUser;
    let dbUser;
    
    try {
      // 1. Create Clerk user
      console.log('[Admin User Create] Creating Clerk user');
      clerkUser = await clerkClient().users.createUser({
        emailAddress: [email],
        password: tempPassword,
        firstName,
        lastName,
      });
      console.log('[Admin User Create] Clerk user created:', clerkUser.id);
      
      // 2. Create Volumetrica user
      console.log('[Admin User Create] Creating Volumetrica user');
      const volumetricaRequest = {
        email,
        firstName,
        lastName,
        country,
        ...(state && state !== '' ? { state } : {}),
      };
      
      volumetricaUser = await volumetricaApi.users.create(volumetricaRequest);
      console.log('[Admin User Create] Volumetrica user created:', volumetricaUser);
      
      // 3. Create database mapping
      console.log('[Admin User Create] Creating database record');
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          volumetricaId: volumetricaUser.userId,
          email,
          firstName,
          lastName,
          country,
          state: state || null,
        },
      });
      console.log('[Admin User Create] Database record created:', dbUser.id);
      
      // Log audit entry
      await prisma.auditLog.create({
        data: {
          userId: dbUser.id,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: dbUser.id,
          metadata: {
            createdBy: 'admin',
            clerkId: clerkUser.id,
            volumetricaId: volumetricaUser.userId,
          },
        },
      });
      
      // Return successful response with rate limit headers
      // SECURITY: Never return passwords in API responses
      // TODO: Implement secure password delivery (email, SMS, or admin UI)
      return NextResponse.json({
        success: true,
        data: {
          userId: dbUser.id,
          clerkId: clerkUser.id,
          volumetricaId: volumetricaUser.userId,
          email,
          firstName,
          lastName,
          // Password removed for security - implement secure delivery method
        },
        message: 'User created successfully. Temporary password must be communicated securely.'
      }, { 
        status: 201,
        headers 
      });
      
    } catch (error: any) {
      console.error('[Admin User Create] Error during creation:', error);
      
      // Rollback logic - clean up any partially created resources
      if (clerkUser && !volumetricaUser) {
        // If Clerk user was created but Volumetrica failed, delete Clerk user
        try {
          console.log('[Admin User Create] Rolling back Clerk user creation');
          await clerkClient().users.deleteUser(clerkUser.id);
        } catch (rollbackError) {
          console.error('[Admin User Create] Failed to rollback Clerk user:', rollbackError);
        }
      }
      
      if (dbUser) {
        // If database record was created, delete it
        try {
          console.log('[Admin User Create] Rolling back database record');
          await prisma.user.delete({ where: { id: dbUser.id } });
        } catch (rollbackError) {
          console.error('[Admin User Create] Failed to rollback database record:', rollbackError);
        }
      }
      
      throw error;
    }
    
  } catch (error: any) {
    console.error('[Admin User Create] Error caught:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.log('[Admin User Create] Zod validation error');
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
      console.log('[Admin User Create] Volumetrica API error');
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle Clerk errors
    if (error?.errors && Array.isArray(error.errors)) {
      console.log('[Admin User Create] Clerk API error');
      return NextResponse.json({
        success: false,
        message: 'Failed to create user in Clerk',
        details: error.errors.map((e: any) => e.message)
      }, { status: 400 });
    }
    
    // Handle other errors
    console.error('[Admin User Create] Unexpected error:', error);
    const errorMessage = error?.message || 'An unexpected error occurred';
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      details: ['An unexpected error occurred while creating the user']
    }, { status: 500 });
  }
}