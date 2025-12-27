/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { filePath, backupDirectory } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }
    
    // Determine backup directory
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const backupDir = backupDirectory || path.join(fileDir, 'config-backups');
    
    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });
    
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const nameParts = fileName.split('.');
    const extension = nameParts.pop();
    const name = nameParts.join('.');
    const backupFileName = `${name}_backup_${timestamp}.${extension}`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // Read original file and write to backup
    const content = await fs.readFile(filePath, 'utf8');
    await fs.writeFile(backupPath, content, 'utf8');
    
    // Get file stats
    const stats = await fs.stat(backupPath);
    
    return NextResponse.json({
      success: true,
      backupPath,
      backupFileName,
      backupDirectory: backupDir,
      originalPath: filePath,
      size: stats.size,
      timestamp: stats.mtime
    });
    
  } catch (error) {
    console.error('Backup config API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET endpoint to list all backups in a directory
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const directory = searchParams.get('directory');
    
    if (!directory) {
      return NextResponse.json({
        success: false,
        error: 'Directory parameter is required'
      }, { status: 400 });
    }
    
    const backupDir = path.join(directory, 'config-backups');
    
    try {
      await fs.access(backupDir);
    } catch {
      return NextResponse.json({
        success: true,
        backups: [],
        backupDirectory: backupDir,
        message: 'No backup directory found'
      });
    }
    
    const files = await fs.readdir(backupDir);
    const backups = [];
    
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          fileName: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          isBackup: file.includes('_backup_')
        });
      }
    }
    
    // Sort by creation date, newest first
    backups.sort((a, b) => b.created - a.created);
    
    return NextResponse.json({
      success: true,
      backups,
      backupDirectory: backupDir,
      count: backups.length
    });
    
  } catch (error) {
    console.error('List backups API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
