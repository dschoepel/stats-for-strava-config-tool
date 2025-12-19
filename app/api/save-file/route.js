/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { path, content } = await request.json();
    
    if (!path) {
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

    // Validate YAML syntax before saving
    try {
      YAML.parse(content);
    } catch (yamlError) {
      return NextResponse.json({
        success: false,
        error: `Invalid YAML syntax: ${yamlError.message}`
      }, { status: 400 });
    }

    // Write the file
    await fs.writeFile(path, content, 'utf8');

    // Get file stats for confirmation
    const stats = await fs.stat(path);

    return NextResponse.json({
      success: true,
      message: 'File saved successfully',
      path: path,
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
