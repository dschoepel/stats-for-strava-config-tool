# Authentication System Documentation

## Overview

This application implements a **simple, secure, single-user authentication system** for self-hosted deployments. It uses bcrypt password hashing, JWT session tokens, and HTTP-only cookies. No external authentication providers or databases are required.

---

## Features

✅ **First-time registration** - Set up your admin password on first launch  

✅ **Secure login** - Username + password authentication  

✅ **Password reset** - Generate reset tokens when needed  

✅ **Session persistence** - Configurable session duration (default: 7 days)  

✅ **HTTP & HTTPS support** - Works on both protocols  

✅ **Route protection** - Middleware blocks unauthorized access  

✅ **Lightweight** - No external dependencies beyond bcrypt and JWT  

---

## Environment Variables

Add these variables to your `.env` file:

```env
# Authentication Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=
PASSWORD_RESET_TOKEN=
SESSION_SECRET=change-this-to-a-long-random-secret-string
SESSION_MAX_AGE=604800
```

### Variable Descriptions

| Variable               | Description                                                    | Default                    |
| ---------------------- | -------------------------------------------------------------- | -------------------------- |
| `ADMIN_USERNAME`       | The username for login                                         | `admin`                    |
| `ADMIN_PASSWORD_HASH`  | Bcrypt hash of the password (leave empty for first-time setup) | (empty)                    |
| `PASSWORD_RESET_TOKEN` | Token for password reset (auto-generated when needed)          | (empty)                    |
| `SESSION_SECRET`       | Secret key for signing JWT tokens (⚠️ **CHANGE THIS!**)       | `default-secret-change-me` |
| `SESSION_MAX_AGE`      | Session duration in seconds                                    | `604800` (7 days)          |

⚠️ **IMPORTANT**: Generate a strong, random `SESSION_SECRET` before deploying to production!

### How to Generate a Secure Session Secret

**PowerShell (Windows) - Recommended:**

```powershell
# Generate a random 64-character hex string
-join ((1..64) | ForEach-Object { '{0:X}' -f (Get-Random -Maximum 16) })
```

**Alternative PowerShell methods:**

```powershell
# Base64 encoded (44 characters)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# URL-safe characters (64 characters)
-join ((1..64) | ForEach-Object { 
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
    $chars[(Get-Random -Maximum $chars.Length)]
})
```

**Node.js (Cross-platform):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Linux/Mac:**

```bash
# Using openssl
openssl rand -hex 32

# Using /dev/urandom
head -c 32 /dev/urandom | base64
```

Copy the generated string to your `.env` file as `SESSION_SECRET`.

---

## First-Time Setup

### Step 1: Configure Environment

1. Copy `.env.config-tool.example` to `.env.config-tool`
2. Set `ADMIN_USERNAME` to your desired username (e.g., `dave`)
3. **Generate a strong `SESSION_SECRET`** (see above)
4. Leave `ADMIN_PASSWORD_HASH` empty
5. Save the file

### Step 2: Start the Application

**Docker (Recommended):**

```bash
docker compose up -d config-manager
```

**Standalone (Node.js):**

```bash
npm install
npm run dev
```

### Step 3: Register

1. Navigate to your Config Tool URL:
   - Docker: `http://localhost:8092`
   - Standalone: `http://localhost:3000`
2. You'll be redirected to `/register`
3. Enter your password (minimum 8 characters)
4. Confirm your password
5. Click **Register**

Your password will be hashed and stored in `.env.config-tool` as `ADMIN_PASSWORD_HASH`. You'll be automatically logged in.

---

## Usage

### Login

1. Navigate to your Config Tool login URL:
   - Docker: `http://localhost:8092/login`
   - Standalone: `http://localhost:3000/login`
2. Enter your username and password
3. Click **Sign In**

Sessions persist for 7 days by default (configurable via `SESSION_MAX_AGE`).

### Logout

Sessions are stored in HTTP-only cookies. To log out:

1. Make a POST request to `/api/auth/logout`, OR
2. Clear your browser cookies, OR
3. Wait for the session to expire

**Example logout (JavaScript):**

```javascript
await fetch('/api/auth/logout', { method: 'POST' });
window.location.href = '/login';
```

### Password Reset

If you forget your password:

1. Navigate to your reset password URL:
   - Docker: `http://localhost:8092/reset-password`
   - Standalone: `http://localhost:3000/reset-password`
2. Click **Generate Reset Token**
3. Copy the generated token (also saved to `.env` as `PASSWORD_RESET_TOKEN`)
4. Paste the token into the form
5. Enter your new password
6. Click **Reset Password**

The token is cleared after successful reset.

---

## Change Password

Once logged in, you can change your password at any time without needing a reset token.

### How to Change Your Password

1. Click on your **username/avatar** in the top-right corner of the navbar
2. Select **Change Password** from the dropdown menu
3. Enter your **current password**
4. Enter your **new password** (minimum 8 characters)
5. Confirm your new password
6. Click **Change Password**

**Important Notes:**

- Your current password is required (for security verification)
- The new password must be different from your current password
- A password strength indicator helps you choose a strong password
- After changing your password, you'll be automatically logged out and redirected to the login page
- You must login again with your new password

**Use Cases:**

- Regular security maintenance (change password periodically)
- Suspected password compromise
- Updating from a temporary password

---

## User Menu

The **User Menu** is located in the top-right corner of the navbar (next to the theme toggle button).

### Features:

- **Avatar Display:** Shows your username initials in a circular avatar
- **Username Label:** Displays your full username (hidden on small screens)
- **Dropdown Menu:** Click to access account options

### Menu Options:

1. **Change Password** - Navigate to the password change page
2. **Logout** - End your session and return to login (requires confirmation)

### Accessing the User Menu:

- **Desktop:** Click on your username/avatar in the navbar
- **Mobile:** Click on your avatar icon (username hidden, avatar visible)

---

## API Endpoints

### `GET /api/auth/user`

Get current authenticated user information.

**Authentication:** Required (protected by session cookie)

**Response (success):**

```json
{
  "success": true,
  "username": "dave"
}
```

**Response (error):**

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### `POST /api/auth/change-password`

Change the user's password (requires current password verification).

**Authentication:** Required (protected by session cookie)

**Request:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response (success):**

```json
{
  "success": true,
  "message": "Password changed successfully. Please login with your new password."
}
```

**Response (error - incorrect current password):**

```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

**Response (error - password too short):**

```json
{
  "success": false,
  "error": "New password must be at least 8 characters"
}
```

**Response (error - same password):**

```json
{
  "success": false,
  "error": "New password must be different from current password"
}
```

**Behavior:**

- Validates current password using bcrypt
- Hashes new password with bcrypt (salt rounds: 10)
- Updates `ADMIN_PASSWORD_HASH` in `.env` file
- **Regenerates `SESSION_SECRET`** to invalidate all existing sessions (v1.1.0+)
- Clears session cookie (forces re-login)

**Security Note (v1.1.0+):**

When you change your password, the `SESSION_SECRET` is automatically regenerated. This invalidates **all** existing session tokens across all devices/browsers, not just the current session. This is a security feature that ensures:

- Compromised sessions from the old password are invalidated
- Any tokens an attacker may have captured become useless
- A clean security slate with the new password

---

### `POST /api/auth/login`

Authenticate with username and password.

**Request:**

```json
{
  "username": "dave",
  "password": "mypassword"
}
```

**Response (success):**

```json
{
  "success": true,
  "message": "Login successful"
}
```

Sets `sfs_session` cookie.

---

### `POST /api/auth/register`

Register the admin password (only allowed if `ADMIN_PASSWORD_HASH` is empty).

**Request:**

```json
{
  "password": "mypassword",
  "confirmPassword": "mypassword"
}
```

**Response (success):**

```json
{
  "success": true,
  "message": "Registration successful"
}
```

Sets `sfs_session` cookie and writes `ADMIN_PASSWORD_HASH` to `.env`.

---

### `GET /api/auth/register`

Check if registration is allowed.

**Response:**

```json
{
  "success": true,
  "registrationAllowed": true
}
```

---

### `POST /api/auth/request-reset`

Generate a password reset token.

**Response:**

```json
{
  "success": true,
  "message": "Reset token generated successfully",
  "token": "a1b2c3d4..."
}
```

Writes `PASSWORD_RESET_TOKEN` to `.env`.

---

### `POST /api/auth/reset-password`

Reset password using the reset token.

**Request:**

```json
{
  "token": "a1b2c3d4...",
  "password": "mynewpassword",
  "confirmPassword": "mynewpassword"
}
```

**Response (success):**

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

Sets `sfs_session` cookie, writes new `ADMIN_PASSWORD_HASH`, and clears `PASSWORD_RESET_TOKEN`.

---

### `GET /api/auth/reset-password`

Check if password reset is allowed.

**Response:**

```json
{
  "success": true,
  "resetAllowed": true
}
```

---

### `POST /api/auth/logout`

Clear the session cookie.

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### `POST /api/auth/refresh`

Refresh the session token to extend the session duration. Useful for long-running operations like console commands.

**Authentication:** Required (protected by session cookie)

**Request:** No body required

**Response (success):**

```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Response (error - not authenticated):**

```json
{
  "success": false,
  "error": "Not authenticated",
  "code": "NOT_AUTHENTICATED"
}
```

**Response (error - token expired):**

```json
{
  "success": false,
  "error": "Session expired",
  "code": "TOKEN_EXPIRED"
}
```

**Response (error - token invalid):**

```json
{
  "success": false,
  "error": "Invalid token",
  "code": "TOKEN_INVALID"
}
```

**Behavior:**

- Verifies the current session token
- Issues a new token with a fresh expiration time
- Sets a new `sfs_session` cookie
- Session duration resets to `SESSION_MAX_AGE` from current time

**Use Cases:**

- Extend sessions during long-running operations (console commands)
- Keep sessions alive for active users
- Prevent session timeout during data entry

---

## Token Error Codes

The authentication system distinguishes between different error conditions with specific error codes:

| Code | Description | User Action |
|------|-------------|-------------|
| `NOT_AUTHENTICATED` | No session cookie present | Redirect to login |
| `TOKEN_EXPIRED` | Token was valid but has expired | Redirect to login |
| `TOKEN_INVALID` | Token signature invalid or malformed | Redirect to login |
| `SESSION_SECRET_CHANGED` | Session secret was regenerated | Redirect to login |

These codes help client-side code determine the appropriate response:

```javascript
// Example client-side handling
const response = await fetch('/api/some-protected-route');
const data = await response.json();

if (!data.success && data.code === 'TOKEN_EXPIRED') {
  // Session expired - redirect to login
  window.location.href = '/login?reason=expired';
} else if (!data.success && data.code === 'TOKEN_INVALID') {
  // Token corrupted - clear and redirect
  window.location.href = '/login?reason=invalid';
}
```

---

## Middleware & Route Protection

The application uses `proxy.js` (Next.js 16 middleware) to protect routes from unauthorized access.

### Protected Routes

All routes are protected by default and require authentication **except**:

**Public Pages:**

- `/login` - Login page
- `/register` - First-time registration page
- `/reset-password` - Password reset page
- `/change-password` - **PROTECTED** (requires login)

**Public API Routes:**

- `/api/auth/login` - Authentication endpoint
- `/api/auth/register` - Registration endpoint
- `/api/auth/request-reset` - Reset token generation
- `/api/auth/reset-password` - Password reset
- `/api/auth/logout` - Logout endpoint

**Protected API Routes:**

- `/api/auth/user` - Get current user info (requires session)
- `/api/auth/change-password` - Change password (requires session)
- All other `/api/*` routes (requires session)

**System Routes:**

- `/_next/*` - Next.js internals (static files, chunks)
- `/favicon.ico` - Favicon

### How It Works

1. **Every Request:** The proxy checks for a valid `sfs_session` cookie
2. **Public Paths:** If the path is in the public list, allow access
3. **Authentication Check:** 

   - If no cookie → redirect to `/login`
   - If invalid cookie → clear cookie + redirect to `/login`
   - If valid cookie → allow access
4. **Session Validation:** JWT token is verified using `SESSION_SECRET`

### Session Behavior

- **Duration:** 7 days by default (configurable via `SESSION_MAX_AGE`)
- **Type:** HTTP-only, signed JWT cookie
- **Renewal:** Sessions can be explicitly refreshed via `/api/auth/refresh` (v1.1.0+)
- **Expiration:** After `SESSION_MAX_AGE` seconds from last login/refresh, user must login again
- **Security:** Cookie is cleared on logout; all sessions invalidated on password change

---

## Security Considerations

### ✅ **What We Do Well**

- ✅ Passwords are hashed with bcrypt (never stored in plain text)
- ✅ Sessions use signed JWT tokens (tamper-proof)
- ✅ Cookies are HTTP-only (protected from XSS)
- ✅ Cookies use `SameSite=lax` (protected from CSRF)
- ✅ Sessions expire after configurable duration
- ✅ Invalid tokens are rejected and cookies cleared

### ⚠️ **Recommendations for Production**

1. **Use HTTPS**  

   Set `FORCE_HTTPS=true` in `.env` to enable secure cookies.
1. **Generate a Strong `SESSION_SECRET`**  

   Use a cryptographically secure random string (64+ characters).
1. **Protect Your `.env` File**  

   - Set file permissions: `chmod 600 .env` (Linux/Mac)
   - Exclude from version control (already in `.gitignore`)
   - Back up securely (encrypted)
1. **Limit Session Duration**  

   For high-security environments, reduce `SESSION_MAX_AGE` to 1 hour or less.
1. **Monitor for Brute-Force Attacks**  

1. **Monitor for Brute-Force Attacks**  

   Consider adding rate limiting to `/api/auth/login` if exposed to the internet.
1. **Docker Considerations**  

   - **Mount `.env` as a volume** - Password hashes must persist outside the container
   - **Ensure write permissions** - The container user must be able to write to `.env`
   - **Use a separate .env file** - Avoid Docker Compose variable expansion warnings
   - Use Docker secrets for `SESSION_SECRET` in production
   - **Recommended docker-compose.yml setup:**
     ```yaml
     config-tool:
       environment:
         - TZ=${TZ}
         - USERMAP_UID=${USERMAP_UID}
         - USERMAP_GID=${USERMAP_GID}
       volumes:
         - ./.env.config-tool:/app/.env  # Separate file avoids ${VAR} conflicts
     ```
   - **Why separate file?** Bcrypt hashes contain `$` characters (e.g., `$2a$10$...`) which Docker Compose interprets as variable expansion syntax `${VAR}`. Using a dedicated `.env.config-tool` file prevents warning messages when running `docker-compose up`.

---

## Troubleshooting

### Password not persisting in Docker

**Cause:** `.env` file not mounted as a writable volume in Docker.

**Solution:**

1. Add `.env` volume mount to `docker-compose.yml`:
   ```yaml
   volumes:
     - ./.env:/app/.env
   ```
2. Ensure the file has correct permissions (readable/writable by container user)
3. Restart the container: `docker-compose down && docker-compose up -d`
4. Check container logs: `docker logs stats-for-strava-config-tool`

**Why this happens:** Docker's `env_file:` directive loads environment variables at startup but doesn't mount the file for writing. Password registration and changes require writing the hash back to `.env`.

---

### "Registration not allowed"

**Cause:** `ADMIN_PASSWORD_HASH` is already set.  

**Solution:** Use the password reset flow or manually clear `ADMIN_PASSWORD_HASH` in `.env`.

---

### "Invalid username or password"

**Cause:** Credentials don't match or password not set.  

**Solution:** 

- Verify `ADMIN_USERNAME` in `.env`
- If first-time setup, use `/register` first
- If forgotten password, use `/reset-password`

---

### "Current password is incorrect" (Change Password)

**Cause:** The current password entered doesn't match your existing password.  

**Solution:**

- Double-check your current password for typos
- If you've forgotten it, logout and use `/reset-password` instead
- Change Password requires knowing your current password (security feature)

---

### "Invalid reset token"

**Cause:** Token doesn't match `PASSWORD_RESET_TOKEN` in `.env`.  

**Solution:** Generate a new token via `/reset-password`.

---

### "Session expired" on every login

**Cause:** `SESSION_SECRET` changed after login.  

**Solution:** Keep `SESSION_SECRET` consistent. If you must change it, all users will need to log in again.

---

### Can't logout / session persists

**Cause:** Cookie not being cleared properly.  

**Solution:**

- Clear browser cookies for the domain manually
- Check browser console for errors
- Verify `/api/auth/logout` returns success response

---

### Changes to `.env` not reflected

**Cause:** Next.js caches environment variables at build time.  

**Solution:** Restart the dev server (`npm run dev`) or rebuild (`npm run build`).

---

## File Structure

```
app/
├── login/
│   └── page.jsx                    # Login UI (Chakra v3)
├── register/
│   └── page.jsx                    # Registration UI (Chakra v3)
├── reset-password/
│   └── page.jsx                    # Password reset UI (Chakra v3)
├── change-password/
│   └── page.jsx                    # Change password UI (Chakra v3)
├── _components/
│   └── layout/
│       ├── Navbar.jsx              # Top navigation with UserMenu
│       └── UserMenu.jsx            # User avatar/dropdown menu
└── api/
    └── auth/
        ├── login/route.js          # Login handler
        ├── register/route.js       # Registration handler
        ├── request-reset/route.js  # Reset token generator
        ├── reset-password/route.js # Password reset handler
        ├── change-password/route.js # Change password handler
        ├── refresh/route.js        # Token refresh handler (v1.1.0+)
        ├── user/route.js           # Get current user info
        └── logout/route.js         # Logout handler

src/
└── utils/
    └── auth.js                     # Auth utilities (bcrypt, JWT, cookies)

proxy.js                            # Route protection (Next.js 16)
.env                                # Environment variables
```

---

## Design Decisions

### Why bcrypt?

- Industry standard for password hashing
- Built-in salt generation
- Configurable work factor (future-proof)
- `bcryptjs` is pure JavaScript (no native compilation issues on Windows)

### Why JWT?

- Stateless (no database required)
- Self-contained (username embedded in token)
- Signed (tamper-proof)
- Expiration built-in

### Why HTTP-only cookies?

- Protected from JavaScript access (XSS prevention)
- Automatically sent with requests (no manual token management)
- Works across all pages/API routes

### Why write to `.env`?

- Simple (no database setup)
- Self-hosted single-user context (low complexity)
- File-based persistence (survives restarts)
- Easy to back up and version

---

## Credits

Built with:

- [Next.js](https://nextjs.org/) - React framework with App Router
- [Chakra UI v3](https://www.chakra-ui.com/) - Component library
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JWT signing/verification
- [cookie](https://github.com/jshttp/cookie) - Cookie serialization

---

## License

This authentication system is part of the Stats for Strava Config Tool and inherits its license.