// src/utils/auth.js
/* eslint-disable no-undef */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

// Environment variable getters
export function getAdminUsername() {
  return process.env.ADMIN_USERNAME || 'admin';
}

export function getAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || '';
}

export function getPasswordResetToken() {
  return process.env.PASSWORD_RESET_TOKEN || '';
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET || 'default-secret-change-me';
}

export function getSessionMaxAge() {
  return parseInt(process.env.SESSION_MAX_AGE || '604800', 10); // 7 days default
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
    return { valid: false, error: error.message };
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
