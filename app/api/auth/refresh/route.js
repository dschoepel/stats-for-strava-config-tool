// app/api/auth/refresh/route.js
import { NextResponse } from 'next/server';
import { verifySession, signSession, serializeSessionCookie } from '../../../../src/utils/auth.js';

/**
 * POST /api/auth/refresh
 * Refresh an existing valid session token with a new one
 * Extends the session expiration without requiring re-login
 */
export async function POST(request) {
  try {
    const { token } = await request.json();

    // Validate input
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token is required',
        code: 'MISSING_TOKEN'
      }, { status: 400 });
    }

    // Verify existing token
    const verification = verifySession(token);
    
    if (!verification.valid) {
      // Return specific error code for expired vs invalid tokens
      const statusCode = verification.code === 'TOKEN_EXPIRED' ? 401 : 403;
      return NextResponse.json({
        success: false,
        error: verification.error,
        code: verification.code
      }, { status: statusCode });
    }

    // Issue new token with extended expiration
    const newToken = signSession(verification.username);
    const cookie = serializeSessionCookie(newToken);

    // Return new token with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    }, { status: 500 });
  }
}
