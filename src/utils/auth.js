// src/utils/auth.js
/* eslint-disable no-undef */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import fs from 'fs';
import path from 'path';

// Helper to read .env file directly (bypasses Next.js env caching)
function readEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          value = value.replace(/^["']|["']$/g, '');
          envVars[key] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error);
    return {};
  }
}

// Environment variable getters
export function getAdminUsername() {
  const envVars = readEnvFile();
  return envVars.ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin';
}

export function getAdminPasswordHash() {
  const envVars = readEnvFile();
  return envVars.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH || '';
}

export function getPasswordResetToken() {
  const envVars = readEnvFile();
  return envVars.PASSWORD_RESET_TOKEN || process.env.PASSWORD_RESET_TOKEN || '';
}

export function getSessionSecret() {
  const envVars = readEnvFile();
  return envVars.SESSION_SECRET || process.env.SESSION_SECRET || 'default-secret-change-me';
}

export function getSessionMaxAge() {
  const envVars = readEnvFile();
  const value = envVars.SESSION_MAX_AGE || process.env.SESSION_MAX_AGE || '604800';
  return parseInt(value, 10); // 7 days default
}

// Bcrypt helpers
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// JWT session helpers
export function signSession(username) {
  const secret = getSessionSecret();
  const maxAge = getSessionMaxAge();
  
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, secret, { expiresIn: maxAge });
}

export function verifySession(token) {
  try {
    const secret = getSessionSecret();
    const decoded = jwt.verify(token, secret);
    return { valid: true, username: decoded.username };
  } catch (error) {
    // Distinguish between expired and invalid tokens
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: error.message, code: 'TOKEN_EXPIRED' };
    } else if (error.name === 'JsonWebTokenError') {
      return { valid: false, error: error.message, code: 'TOKEN_INVALID' };
    } else {
      return { valid: false, error: error.message, code: 'UNKNOWN_ERROR' };
    }
  }
}

// Cookie serialization
export function serializeSessionCookie(token) {
  const maxAge = getSessionMaxAge();
  
  return serialize('sfs_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

export function serializeClearCookie() {
  return serialize('sfs_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

// Generate reset token
export function generateResetToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to update .env via the existing API endpoint
export async function updateEnvVariable(key, value) {
  const response = await fetch('http://localhost:3000/api/update-env', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update environment variable');
  }

  return response.json();
}
