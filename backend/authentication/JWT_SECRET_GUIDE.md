# JWT Secret Key Guide

## What is a JWT Secret?

A JWT (JSON Web Token) secret is used to sign and verify authentication tokens. It should be:
- **Long and random** (at least 64 characters)
- **Kept secret** (never commit to git)
- **Unique** (different for each environment)

## Generate a New JWT Secret

### Method 1: Using Node.js (Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This will output a 128-character hexadecimal string like:
```
d69fdcf71fd5cb06a60b2792d7f4b04348bae27c9ac55991296fa0d3a0ba28f5147cbfb7b07e957912700e42c1bc1c65c633d1cf5a48cc7c99b43dbe9354ead3
```

### Method 2: Using OpenSSL

```bash
openssl rand -hex 64
```

### Method 3: Online Generator

You can also use online tools like:
- https://randomkeygen.com/
- https://www.grc.com/passwords.htm

**Note**: For production, always generate secrets locally, never use online generators for production secrets.

## Update Your .env File

1. Generate a new secret using one of the methods above
2. Copy the generated secret
3. Open `backend/authentication/.env`
4. Replace the value of `JWT_SECRET`:

```env
JWT_SECRET=your-generated-secret-here
```

## Security Best Practices

1. **Never commit secrets to git** - The `.env` file should be in `.gitignore`
2. **Use different secrets for different environments**:
   - Development: One secret
   - Staging: Different secret
   - Production: Another secret
3. **Rotate secrets periodically** - Change them every 90 days or if compromised
4. **Keep secrets long** - At least 64 bytes (128 hex characters)
5. **Store production secrets securely** - Use environment variables or secret management services

## What Happens If You Change the Secret?

⚠️ **Warning**: If you change the JWT secret, all existing tokens will become invalid. Users will need to log in again.

This is why it's important to:
- Use the same secret across all server instances in production
- Only change it during scheduled maintenance
- Notify users if you need to invalidate all sessions

## Current Configuration

Your JWT secret is stored in `backend/authentication/.env`:
```env
JWT_SECRET=d69fdcf71fd5cb06a60b2792d7f4b04348bae27c9ac55991296fa0d3a0ba28f5147cbfb7b07e957912700e42c1bc1c65c633d1cf5a48cc7c99b43dbe9354ead3
JWT_EXPIRES_IN=2h
```

The token expiration is set to 2 hours (`2h`). You can change this to:
- `5m` - 5 minutes
- `1h` - 1 hour
- `24h` - 24 hours
- `7d` - 7 days

