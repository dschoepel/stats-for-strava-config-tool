// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { 
  getAdminUsername, 
  getAdminPasswordHash, 
  comparePassword, 
  signSession, 
  serializeSessionCookie 
} from '../../../../src/utils/auth.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }

    const adminUsername = getAdminUsername();
    const adminPasswordHash = getAdminPasswordHash();

    // Check if registration is needed
    if (!adminPasswordHash) {
      return NextResponse.json({
        success: false,
        error: 'No password set. Please register first.',
        requiresRegistration: true
      }, { status: 401 });
    }

    // Validate username
    if (username !== adminUsername) {
      return NextResponse.json({
        success: false,
        error: 'Invalid username or password'
      }, { status: 401 });
    }

    // Validate password
    const isValid = await comparePassword(password, adminPasswordHash);
    
    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid username or password'
      }, { status: 401 });
    }

    // Create session token
    const token = signSession(username);
    const cookie = serializeSessionCookie(token);

    // Return success with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful'
    });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
