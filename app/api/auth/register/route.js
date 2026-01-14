// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { 
  getAdminUsername,
  getAdminPasswordHash, 
  hashPassword, 
  signSession, 
  serializeSessionCookie 
} from '../../../../src/utils/auth.js';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { password, confirmPassword } = await request.json();

    // Validate inputs
    if (!password || !confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'Password and confirmation are required'
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

    // Check if password is already set
    const adminPasswordHash = getAdminPasswordHash();
    if (adminPasswordHash) {
      return NextResponse.json({
        success: false,
        error: 'Registration not allowed. Password already set.'
      }, { status: 403 });
    }

    // Hash the password
    const hash = await hashPassword(password);

    // Update .env file directly
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      console.log('.env file not found, creating new one');
    }

    const lines = envContent.split('\n');
    let hashFound = false;
    const updatedLines = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      const match = trimmedLine.match(/^([^=]+)=/);
      if (match && match[1].trim() === 'ADMIN_PASSWORD_HASH') {
        updatedLines.push(`ADMIN_PASSWORD_HASH=${hash.replace(/\$/g, '\\$')}`);
        hashFound = true;
      } else {
        updatedLines.push(line);
      }
    }

    if (!hashFound) {
      updatedLines.push(`ADMIN_PASSWORD_HASH=${hash.replace(/\$/g, '\\$')}`);
    }

    await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');

    console.log('Password hash saved to .env file');

    // Create session token
    const username = getAdminUsername();
    const token = signSession(username);
    const cookie = serializeSessionCookie(token);

    // Return success with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful'
    });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Check if registration is allowed
export async function GET() {
  try {
    const adminPasswordHash = getAdminPasswordHash();
    
    return NextResponse.json({
      success: true,
      registrationAllowed: !adminPasswordHash
    });
  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
