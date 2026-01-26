# Authentication & Account Security

Secure access and password management for the Config Tool

---

## Overview

The Config Tool uses a simple, secure single-user authentication system to protect your configuration from unauthorized access. When you first start the application, you'll create an admin password that will be required for all future logins.

**Key Features:**

- **First-time registration** - Set up your password on first launch
- **Secure sessions** - Stay logged in for 7 days (default)
- **Password management** - Change or reset your password anytime
- **User menu** - Quick access to account options in the navbar

---

## First-Time Setup

### Step 1: Generate a Session Secret (Important!)

Before registering your account, you should generate a strong, random session secret. This secret is used to sign your login tokens and keep your sessions secure.

⚠️ **This is a critical security step** - The default session secret is insecure and should be changed before first use.

#### How to Generate a Session Secret

**PowerShell (Windows) - Recommended:**

```powershell
-join ((1..64) | ForEach-Object { '{0:X}' -f (Get-Random -Maximum 16) })
```

**Node.js (Cross-platform):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Linux/Mac:**

```bash
openssl rand -hex 32
```

#### Adding the Secret to Your Configuration

1. Run one of the commands above to generate a random string
2. Open your `.env` file
3. Find the line: `SESSION_SECRET=default-secret-change-me`
4. Replace `default-secret-change-me` with your generated string
5. Save the file

**Example:**

```env
SESSION_SECRET=F1B452F4F5A9A9BCBDFCBF9BB4BB0A4BB76C64CF9CC38672CFBF0A2F205DCDF8
```

⚠️ **Important:** Never share your session secret. Keep it private like a password.

### Step 2: Register Your Account

When you first access the Config Tool, you'll be directed to the registration page:

1. Navigate to `http://localhost:8092` (or your configured URL)
2. You'll be redirected to the **Register** page
3. Enter a strong password (minimum 8 characters)
4. Confirm your password
5. Click **Register**

Your password is immediately encrypted and stored securely. You'll be automatically logged in and redirected to the home page.

### Step 3: Set Your Username (Optional)

By default, your username is `admin`. To customize it:

1. Stop the application
2. Open your `.env` file
3. Change the `ADMIN_USERNAME` value to your preferred username
4. Save the file and restart the application

---

## Logging In

1. Navigate to the Config Tool URL
2. Enter your username and password
3. Click **Sign In**

**Session Duration:** Your login session lasts for 7 days by default. After this period, you'll need to log in again.

**Remember:** Protected pages will automatically redirect you to the login page if your session has expired.

---

## User Menu

The **User Menu** is located in the top-right corner of the navbar (next to the theme toggle).

### Accessing the Menu

Click on your **avatar** (circular icon with your initials) or **username** to open a dropdown menu with the following options:

- **Change Password** - Update your password while logged in
- **Logout** - End your session and return to the login page

### Avatar Display

- **Desktop view:** Shows both your avatar and username
- **Mobile view:** Shows only your avatar to save space

---

## Changing Your Password

To change your password while logged in:

1. Click your **avatar/username** in the top-right corner
2. Select **Change Password** from the dropdown
3. Enter your **current password** (required for verification)
4. Enter your **new password** (minimum 8 characters)
5. Confirm your new password
6. Click **Change Password**

**Password Strength Indicator:** A visual meter helps you choose a strong password by showing:

- Too weak (red) - Very short or simple passwords
- Weak (orange) - Basic passwords without variety
- Medium (orange) - Decent passwords with some complexity
- Strong (green) - Long passwords with mixed characters

**After Changing:** You'll be automatically logged out and redirected to the login page. Log in again with your new password.

**Security Note (v1.1.0+):** When you change your password, the session secret is automatically regenerated. This invalidates ALL existing sessions across all devices and browsers, ensuring any potentially compromised sessions are terminated.

**Important:** Your current password is required to change your password. This prevents unauthorized password changes if someone gains access to your active session.

---

## Logging Out

To end your session:

1. Click your **avatar/username** in the top-right corner
2. Select **Logout** from the dropdown
3. Confirm the logout action in the dialog that appears

You'll be redirected to the login page. Your session cookie will be cleared from your browser.

---

## Password Reset (Forgotten Password)

If you forget your password, you can reset it using a reset token:

### Generate a Reset Token

1. Navigate to `http://localhost:8092/reset-password`
2. Click **Generate Reset Token**
3. Copy the generated token (it will also be displayed on screen)
4. **Important:** The token is also saved to your `.env` file

### Reset Your Password

1. On the reset password page, paste the token into the **Reset Token** field
2. Enter your **new password** (minimum 8 characters)
3. Confirm your new password
4. Click **Reset Password**

After a successful reset, the token is cleared and you'll be logged in automatically.

**Alternative Token Access:** If you have direct access to the server, you can also find the reset token in the `.env` file under `PASSWORD_RESET_TOKEN`.

---

## Security Best Practices

### Choose Strong Passwords

- Use at least 8 characters (longer is better)
- Mix uppercase and lowercase letters
- Include numbers and special characters
- Avoid common words or personal information

### Protect Your Session Secret

- **Generate a unique secret** during first-time setup (see above)
- **Never commit your `.env` file** to version control
- **Keep the secret consistent** - Changing it invalidates all active sessions
- **Treat it like a password** - Keep it private and secure

### Protect Your Session

- Don't share your logged-in session with others
- Always logout when using shared computers
- Clear browser cookies if you suspect unauthorized access

### Regular Maintenance

- Change your password periodically (every 3-6 months)
- Use the Change Password feature rather than password reset for routine updates
- Keep your `.env` file secure and backed up

### Environment File Security

Your password (encrypted) and session secrets are stored in the `.env` file:

- **Never commit `.env` to version control** (already excluded via .gitignore)
- **Set file permissions** to restrict read access (Linux/Mac: `chmod 600 .env`)
- **Back up securely** - Include `.env` in your backup routine

---

## Troubleshooting

### "Invalid username or password"

**Possible causes:**

- Incorrect username or password entered
- No password has been set (first-time setup required)

**Solutions:**

- Verify your credentials and try again
- Check that `ADMIN_USERNAME` in `.env` matches what you're entering
- If first-time setup, navigate to `/register`
- If forgotten password, use `/reset-password`

### "Current password is incorrect" (Change Password)

**Cause:** The current password you entered doesn't match your existing password.

**Solutions:**

- Double-check your current password for typos
- If you've forgotten your current password, logout and use the password reset feature instead
- Change Password is designed for users who know their current password

### Session Expires Immediately

**Cause:** The session secret may have changed after login.

**Solution:** The `SESSION_SECRET` in your `.env` file must remain consistent. If it changes, all existing sessions become invalid and users must log in again.

### Can't Access Any Pages

**Cause:** Session cookie may be corrupted or expired.

**Solutions:**

- Clear your browser cookies for the Config Tool domain
- Navigate directly to `/login` to start a fresh session
- Check browser console for error messages

### Changes to `.env` Not Taking Effect

**Cause:** Next.js caches environment variables at startup.

**Solution:** Restart the development server (`npm run dev`) or rebuild the application (`npm run build`) for changes to take effect.

### All Users Logged Out After Server Restart

**Cause:** This happens if `SESSION_SECRET` was changed or is missing.

**Solution:** Ensure `SESSION_SECRET` in `.env` remains the same across restarts. If you need to change it for security reasons, all users will need to log in again (this is expected behavior).

---

## Technical Details

### How Authentication Works

1. **Password Storage:** Passwords are encrypted using bcrypt hashing and stored in the `.env` file
2. **Session Management:** Successful logins create a signed JWT token stored in an HTTP-only cookie
3. **Route Protection:** Middleware automatically checks for valid sessions before allowing access to protected pages
4. **Session Duration:** Default 7 days, configurable via `SESSION_MAX_AGE` in `.env`

### Protected vs Public Pages

**Protected Pages** (require login):

- Home page and all configuration sections
- Settings page
- Dashboard editor
- All utility pages

**Public Pages** (no login required):

- Login page
- Register page
- Reset Password page

---

## Need More Help?

- Check the `.env` file for current authentication settings
- Review browser console for error messages
- Ensure the application has write access to the `.env` file
- Contact support if you're unable to access the application after trying these steps
