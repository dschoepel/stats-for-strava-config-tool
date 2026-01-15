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
    
    console.log('[BACKUP-CONFIG POST] Saving backup:');
    console.log('  - Original file:', filePath);
    console.log('  - File directory:', fileDir);
    console.log('  - Backup directory:', backupDir);
    console.log('  - backupDirectory param:', backupDirectory);
    
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
    
    // Count total backups in directory
    let backupCount = 0;
    try {
      const files = await fs.readdir(backupDir);
      backupCount = files.filter(f => 
        (f.endsWith('.yaml') || f.endsWith('.yml')) && f.includes('_backup_')
      ).length;
    } catch {
      backupCount = 1; // At least the file we just created
    }
    
    return NextResponse.json({
      success: true,
      backupPath,
      backupFileName,
      backupDirectory: backupDir,
      originalPath: filePath,
      size: stats.size,
      timestamp: stats.mtime,
      backupCount
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
    
    console.log('[BACKUP-CONFIG GET] Listing backups:');
    console.log('  - Directory param:', directory);
    
    if (!directory) {
      return NextResponse.json({
        success: false,
        error: 'Directory parameter is required'
      }, { status: 400 });
    }
    
    const backupDir = path.join(directory, 'config-backups');
    console.log('  - Looking in:', backupDir);
    
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
          name: file,
          path: filePath,
          size: stats.size,
          modifiedTime: stats.mtime,
          isBackup: file.includes('_backup_')
        });
      }
    }
    
    // Sort by creation date, newest first
    backups.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    
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

// DELETE endpoint to remove backup files
export async function DELETE(request) {
  try {
    const { filePaths } = await request.json();
    
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'filePaths array is required'
      }, { status: 400 });
    }
    
    // Enforce maximum 50 files
    if (filePaths.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete more than 50 files at once'
      }, { status: 400 });
    }
    
    // Verify all paths contain 'backup' for safety
    const invalidPaths = filePaths.filter(p => !p.includes('backup'));
    if (invalidPaths.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'All file paths must contain "backup" for safety'
      }, { status: 400 });
    }
    
    // Delete files in parallel
    const deleteResults = await Promise.allSettled(
      filePaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
          return { success: true, path: filePath };
        } catch (error) {
          return { success: false, path: filePath, error: error.message };
        }
      })
    );
    
    // Count successful deletions
    const deletedPaths = deleteResults
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value.path);
    
    const failedPaths = deleteResults
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'fulfilled' ? r.value.path : r.reason);
    
    return NextResponse.json({
      success: true,
      deletedCount: deletedPaths.length,
      deletedPaths,
      failedCount: failedPaths.length,
      failedPaths
    });
    
  } catch (error) {
    console.error('Delete backups API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
