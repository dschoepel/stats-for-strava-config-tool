import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Key is required'
      }, { status: 400 });
    }

    // Get the .env file path (root of project)
    const envPath = path.join(process.cwd(), '.env');

    // Read the existing .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (error) {
      // If .env doesn't exist, create it
      console.log('.env file not found, creating new one');
    }

    // Parse the .env file into lines
    const lines = envContent.split('\n');
    let keyFound = false;
    const updatedLines = [];

    // Update the key if it exists, or prepare to add it
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      // Check if this line contains our key
      const match = trimmedLine.match(/^([^=]+)=/);
      if (match && match[1].trim() === key) {
        // Update the existing key
        updatedLines.push(`${key}=${value}`);
        keyFound = true;
      } else {
        updatedLines.push(line);
      }
    }

    // If key wasn't found, add it to the end
    if (!keyFound) {
      updatedLines.push(`${key}=${value}`);
    }

    // Write the updated content back to .env
    await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');

    console.log(`Updated .env file: ${key}=${value}`);

    return NextResponse.json({
      success: true,
      message: 'Environment variable updated successfully'
    });

  } catch (error) {
    console.error('Error updating .env file:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET - Read current value from .env
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Key is required'
      }, { status: 400 });
    }

    // Read from process.env which contains the .env values
    const value = process.env[key] || null;

    return NextResponse.json({
      success: true,
      value
    });

  } catch (error) {
    console.error('Error reading .env value:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
