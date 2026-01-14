// app/api/auth/request-reset/route.js
import { NextResponse } from 'next/server';
import { generateResetToken } from '../../../../src/utils/auth.js';
import fs from 'fs/promises';
import path from 'path';

export async function POST() {
  try {
    // Generate reset token
    const token = generateResetToken();

    // Update .env file directly
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      console.log('.env file not found, creating new one');
    }

    const lines = envContent.split('\n');
    let tokenFound = false;
    const updatedLines = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      const match = trimmedLine.match(/^([^=]+)=/);
      if (match && match[1].trim() === 'PASSWORD_RESET_TOKEN') {
        updatedLines.push(`PASSWORD_RESET_TOKEN=${token}`);
        tokenFound = true;
      } else {
        updatedLines.push(line);
      }
    }

    if (!tokenFound) {
      updatedLines.push(`PASSWORD_RESET_TOKEN=${token}`);
    }

    await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');

    console.log('Reset token generated and saved to .env file');

    return NextResponse.json({
      success: true,
      message: 'Reset token generated successfully',
      token // Return token for self-hosted admin
    });

  } catch (error) {
    console.error('Request reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
