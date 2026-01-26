# Troubleshooting Guide

This guide covers common issues and their solutions for the Stats for Strava Configuration Tool.

---

## Frequently Asked Questions

### General Questions

**Q: Will this tool work with my existing Stats for Strava setup?**

A: Yes! Just mount your config directory and point the tool to your config files.

**Q: Can I run this without Docker?**

A: Yes, but Docker is easier. See [Installation Guide](INSTALLATION.md) for standalone instructions.

**Q: Do I need to keep this running all the time?**

A: No! Only run it when you want to edit configuration. Stop the container when done.

**Q: What happens if I make a mistake?**

A: The tool validates all inputs before saving. Automatic backups are also created before each save, so you can restore from backups if needed.

**Q: Does this replace the Stats for Strava app?**

A: No! This is just a configuration editor. You still need Statistics for Strava to import and display your data.

### Authentication Questions

**Q: Why do I need two .env files?**

A: Docker Compose expands `${VARIABLE}` syntax which breaks bcrypt password hashes (they contain `$2b$` prefixes). Keeping authentication variables in `.env.config-tool` and mounting it directly avoids this issue.

**Q: How do I reset my password if I forgot it?**

A: Generate a reset token and add it to `.env.config-tool`, then use the reset password page. See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed instructions.

**Q: Can I disable authentication?**

A: No, authentication is required for security. This tool modifies your Stats for Strava configuration, so unauthorized access could break your setup.

**Q: How long do sessions last?**

A: Default is 7 days (604800 seconds). Configure with `SESSION_MAX_AGE` in `.env.config-tool`.

**Q: Can multiple people use this at once?**

A: Not recommended - the tool is designed for single-user access and doesn't have conflict resolution.

### File Questions

**Q: Where are my configuration files stored?**

A: In your Stats for Strava config directory, mounted via Docker volumes at `/data/config`.

**Q: Where are backup files saved?**

A: In `<config-path>/backups/` folder (auto-created). Example: `/data/config/backups/config-20260116-143025.yaml`

---

## Common Issues

### Configuration Issues

#### "Cannot read configuration file"

**Causes:**
- Wrong config path in Settings
- File doesn't exist
- Permission issues

**Solutions:**
1. Check your config path in Settings > Files
2. For Docker: Use container path (e.g., `/data/config`), not host path
3. Verify the file exists: `docker exec stats-for-strava-config-tool ls -la /data/config`
4. Check file permissions

#### Form validation errors

**Solutions:**
- Required fields must be filled (marked with *)
- Check value formats (dates must be YYYY-MM-DD, etc.)
- Hover over field descriptions for format requirements

#### Widget definitions not saving

**Solutions:**
- Click the main **Save** button (individual edits are held in memory)
- Check file path in Settings > Files
- Verify write permissions on the settings directory

#### Changes not appearing in Stats for Strava

**Solutions:**
1. Restart your Stats for Strava containers after saving
2. Verify you're editing the correct config file
3. Check Stats for Strava logs for configuration errors

---

### Permission Issues

#### "Permission denied" when saving

**Causes:**
- Container doesn't have write access to volumes
- File/directory permissions incorrect on host
- UID/GID mismatch

**Solutions:**
1. Ensure the container has write access to mounted volumes
2. Check file/directory permissions on the host:
   ```bash
   ls -la ./config
   ```
3. For `.env.config-tool`: Verify UID/GID 1000 can write to the file
4. Fix ownership:
   ```bash
   sudo chown -R 1000:1000 ./config
   ```

---

### Authentication Issues

#### "Redirected to registration page after logging in"

**Causes:**
- `.env.config-tool` file not writable
- Password hash not saved
- Container can't write to env file

**Solutions:**
1. Check `.env.config-tool` file is writable by the container
2. Verify `ADMIN_PASSWORD_HASH` was written to `.env.config-tool`
3. Check container logs: `docker logs stats-for-strava-config-tool`
4. On Windows: Ensure file isn't read-only

#### "Invalid session" or "Session expired" errors

**Causes:**
- SESSION_SECRET not set or changed
- Session expired (default 7 days)

**Solutions:**
1. Verify `SESSION_SECRET` is set in `.env.config-tool` (not the default placeholder)
2. Don't change `SESSION_SECRET` after users are logged in (invalidates existing sessions)
3. Check `SESSION_MAX_AGE` value (default: 604800 seconds = 7 days)

#### Password reset not working

**Solutions:**
1. Generate a reset token: See [AUTHENTICATION.md](AUTHENTICATION.md) for instructions
2. Verify `.env.config-tool` is writable so `PASSWORD_RESET_TOKEN` can be saved
3. Check container logs for permission errors

---

### Container Issues

#### Container won't start

**Causes:**
- Port conflict
- Missing volumes
- Missing env file

**Solutions:**
1. Check port 8092 isn't already in use:
   ```bash
   netstat -an | grep 8092
   ```
   Change to `8093:80` if needed
2. Verify volume paths exist on your host system
3. Check Docker logs: `docker logs stats-for-strava-config-tool`
4. Ensure `.env.config-tool` exists (copy from `.env.config-tool.example`)

#### Container health check failing

**Solutions:**
1. Check container logs: `docker logs stats-for-strava-config-tool`
2. Verify network connectivity
3. Ensure all required environment variables are set

---

### Proxy Issues (Nginx)

#### 502 Bad Gateway

**Causes:**
- Container not running
- Wrong proxy_pass address
- Network issues

**Solutions:**
1. Verify container is running: `docker ps | grep config-tool`
2. Check container accessibility: `curl http://localhost:8092`
3. Verify proxy_pass IP address is correct
4. Check nginx error logs: `sudo tail -f /var/log/nginx/strava-config-tool-error.log`

#### SSL Certificate Errors

**Solutions:**
1. Ensure domain points to your server IP
2. Verify certificates exist:
   ```bash
   sudo ls -la /etc/letsencrypt/live/your-domain.com/
   ```
3. Check certificate expiration: `sudo certbot certificates`
4. Renew if needed: `sudo certbot renew`

#### Connection Timeout

**Solutions:**
1. Increase timeout values in nginx config
2. Check firewall rules for ports 80, 443, and 8092
3. Verify docker network allows external access

---

### SFS Console Issues

See [SFS Console Setup Guide](SFS-CONSOLE-SETUP.md#troubleshooting) for console-specific troubleshooting.

#### Console Shows "Disabled"

- Enable in Settings > User Interface Settings
- Check runner service is running

#### "Runner Offline" Warning

- Verify runner container is healthy
- Check `STATS_CMD_RUNNER_URL` environment variable

#### Commands Fail

- Check helper container logs
- Verify target container name is correct
- Ensure Statistics for Strava container is running

---

## Getting Help

### Check Logs

Docker logs are your first stop for debugging:

```bash
# Config Tool logs
docker logs stats-for-strava-config-tool

# Runner logs (if using SFS Console)
docker logs stats-cmd-runner

# Helper logs (if using SFS Console)
docker logs stats-cmd-helper
```

### Enable Debug Logging

Add to your `.env.config-tool`:

```
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
```

Restart the container to enable verbose logging.

### Report Issues

If you can't resolve an issue:

1. Check existing issues: [GitHub Issues](https://github.com/dschoepel/stats-for-strava-config-tool/issues)
2. Include in your report:
   - Version you're running
   - Docker logs
   - Steps to reproduce
   - Expected vs actual behavior

---

## Next Steps

- [Installation Guide](INSTALLATION.md) - Setup instructions
- [Features Guide](FEATURES.md) - Learn about all features
- [SFS Console Setup](SFS-CONSOLE-SETUP.md) - Console troubleshooting
- [Authentication Guide](AUTHENTICATION.md) - Auth-specific help
