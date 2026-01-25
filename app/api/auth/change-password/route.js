// app/api/auth/change-password/route.js
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  getAdminPasswordHash,
  comparePassword,
  hashPassword,
  serializeClearCookie
} from '../../../../src/utils/auth.js';

export async function POST(request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Current password and new password are required'
      }, { status: 400 });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'New password must be at least 8 characters'
      }, { status: 400 });
    }

    // Get current password hash
    const adminPasswordHash = getAdminPasswordHash();

    if (!adminPasswordHash) {
      return NextResponse.json({
        success: false,
        error: 'No password set. Please register first.'
      }, { status: 401 });
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, adminPasswordHash);
    
    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Current password is incorrect'
      }, { status: 401 });
    }

    // Check that new password is different from current
    const isSame = await comparePassword(newPassword, adminPasswordHash);
    if (isSame) {
      return NextResponse.json({
        success: false,
        error: 'New password must be different from current password'
      }, { status: 400 });
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Generate new SESSION_SECRET to invalidate all existing tokens
    const crypto = await import('crypto');
    const newSessionSecret = crypto.randomBytes(64).toString('hex');

    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      console.log('.env file not found, creating new one');
    }

    const lines = envContent.split('\n');
    let hashFound = false;
    let secretFound = false;
    const updatedLines = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      if (trimmedLine.startsWith('ADMIN_PASSWORD_HASH=')) {
        updatedLines.push(`ADMIN_PASSWORD_HASH=${newHash.replace(/\$/g, '\\$')}`);
        hashFound = true;
      } else if (trimmedLine.startsWith('SESSION_SECRET=')) {
        updatedLines.push(`SESSION_SECRET=${newSessionSecret}`);
        secretFound = true;
      } else {
        updatedLines.push(line);
      }
    }

    // If hash not found, add it
    if (!hashFound) {
      updatedLines.push(`ADMIN_PASSWORD_HASH="${newHash}"`);
    }
    
    // If session secret not found, add it
    if (!secretFound) {
      updatedLines.push(`SESSION_SECRET=${newSessionSecret}`);
    }

    // Write back to .env
    await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');

    console.log('Password changed successfully');
    console.log('New hash written to .env:', newHash);
    console.log('New SESSION_SECRET generated - all existing tokens invalidated');
    console.log('⚠️ IMPORTANT: Restart the dev server for the new password to take effect');

    // Clear session cookie to force re-login
    const clearCookie = serializeClearCookie();

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please restart the dev server and login with your new password.'
    }, {
      status: 200,
      headers: { 'Set-Cookie': clearCookie }
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
