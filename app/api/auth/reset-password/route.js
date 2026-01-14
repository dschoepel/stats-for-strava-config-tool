// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import { 
  getAdminUsername,
  getPasswordResetToken, 
  hashPassword, 
  signSession, 
  serializeSessionCookie 
} from '../../../../src/utils/auth.js';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // Validate inputs
    if (!token || !password || !confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'Token, password, and confirmation are required'
      }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'Passwords do not match'
      }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters'
      }, { status: 400 });
    }

    // Validate reset token
    const storedToken = getPasswordResetToken();
    if (!storedToken) {
      return NextResponse.json({
        success: false,
        error: 'No reset token found. Please request a new reset.'
      }, { status: 400 });
    }

    if (token !== storedToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid reset token'
      }, { status: 401 });
    }

    // Hash the new password
    const hash = await hashPassword(password);

    // Update .env file: replace password hash and clear reset token
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      console.log('.env file not found, creating new one');
    }

    const lines = envContent.split('\n');
    let hashFound = false;
    let tokenFound = false;
    const updatedLines = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      const match = trimmedLine.match(/^([^=]+)=/);
      if (match) {
        const key = match[1].trim();
        if (key === 'ADMIN_PASSWORD_HASH') {
          updatedLines.push(`ADMIN_PASSWORD_HASH=${hash}`);
          hashFound = true;
        } else if (key === 'PASSWORD_RESET_TOKEN') {
          updatedLines.push('PASSWORD_RESET_TOKEN=');
          tokenFound = true;
        } else {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }

    if (!hashFound) {
      updatedLines.push(`ADMIN_PASSWORD_HASH=${hash.replace(/\$/g, '\\$')}`);
    }
    if (!tokenFound) {
      updatedLines.push('PASSWORD_RESET_TOKEN=');
    }

    await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');

    console.log('Password reset successfully');

    // Create session token
    const username = getAdminUsername();
    const sessionToken = signSession(username);
    const cookie = serializeSessionCookie(sessionToken);

    // Return success with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Password reset successful'
    });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Check if reset is allowed
export async function GET() {
  try {
    const resetToken = getPasswordResetToken();
    
    return NextResponse.json({
      success: true,
      resetAllowed: !!resetToken
    });
  } catch (error) {
    console.error('Error checking reset status:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
