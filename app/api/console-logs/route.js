import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = '/var/log/strava-helper/command-logs';

export async function GET() {
  try {
    // Check if directory exists
    try {
      await fs.access(LOG_DIR);
    } catch {
      return NextResponse.json({
        success: true,
        logs: [],
        totalCount: 0,
        totalSize: 0
      });
    }

    const files = await fs.readdir(LOG_DIR);
    const logFiles = [];

    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(LOG_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        
        // Parse filename: YYYY-MM-DD_HH-MM-SS_command-id_args_exitcode.log
        // Example: 2026-01-24_15-30-45_build-files_0.log
        const parts = file.replace('.log', '').split('_');
        
        if (parts.length < 3) continue; // Skip malformed filenames
        
        const [date, time, ...rest] = parts;
        const exitCode = rest[rest.length - 1];
        const command = rest.slice(0, -1).join('_');

        logFiles.push({
          filename: file,
          path: filePath,
          command: command || 'unknown',
          timestamp: `${date} ${time.replace(/-/g, ':')}`,
          size: stats.size,
          exitCode: parseInt(exitCode, 10) || 0,
          createdAt: stats.birthtime.toISOString()
        });
      } catch (err) {
        console.error(`Error processing log file ${file}:`, err);
        continue;
      }
    }

    // Sort by newest first
    logFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalSize = logFiles.reduce((sum, f) => sum + f.size, 0);

    return NextResponse.json({
      success: true,
      logs: logFiles,
      totalCount: logFiles.length,
      totalSize
    });
  } catch (error) {
    console.error('Error listing console logs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const filenames = body.filenames || body.files || [];
    
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files specified'
      }, { status: 400 });
    }

    const deleted = [];
    const errors = [];

    for (const filename of filenames) {
      try {
        // Security: Ensure filename doesn't contain path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          errors.push({ filename, error: 'Invalid filename' });
          continue;
        }

        const filePath = path.join(LOG_DIR, filename);
        await fs.unlink(filePath);
        deleted.push(filename);
      } catch (err) {
        errors.push({ filename, error: err.message });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      deleted,
      errors,
      deletedCount: deleted.length
    });
  } catch (error) {
    console.error('Error deleting console logs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
