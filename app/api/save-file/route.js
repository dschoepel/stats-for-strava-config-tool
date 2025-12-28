/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { path: filePath, content } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }

    if (content === undefined || content === null) {
      return NextResponse.json({
        success: false,
        error: 'File content is required'
      }, { status: 400 });
    }

    // Expand tilde to home directory
    const expandedPath = filePath.startsWith('~') 
      ? path.join(os.homedir(), filePath.slice(1))
      : filePath;

    // Validate YAML syntax before saving
    try {
      YAML.parse(content);
    } catch (yamlError) {
      return NextResponse.json({
        success: false,
        error: `Invalid YAML syntax: ${yamlError.message}`
      }, { status: 400 });
    }

    // Create directory if it doesn't exist
    const directory = path.dirname(expandedPath);
    await fs.mkdir(directory, { recursive: true });

    // Write the file
    await fs.writeFile(expandedPath, content, 'utf8');

    // Get file stats for confirmation
    const stats = await fs.stat(expandedPath);

    return NextResponse.json({
      success: true,
      message: 'File saved successfully',
      path: expandedPath,
      size: stats.size,
      lastModified: stats.mtime.toISOString()
    });

  } catch (error) {
    console.error('Save file API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
