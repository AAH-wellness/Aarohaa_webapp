# Jitsi Meet Migration Guide - Free Video Calling Alternative

## Overview
This guide shows how to replace Daily.co with **Jitsi Meet** (100% free, open source) for embedded video calls.

## Why Jitsi Meet?
- ✅ **Completely FREE** - No credit card, no charges, no limits
- ✅ **Open Source** - Self-hostable or use free cloud (meet.jit.si)
- ✅ **Easy Integration** - Simple iframe embedding
- ✅ **No API Keys Required** - For basic usage
- ✅ **Privacy Friendly** - Can be self-hosted

## Quick Start (Using Free Cloud Service)

### Option 1: Simple Iframe Embed (Easiest)
No backend changes needed! Just replace the Daily iframe with Jitsi.

### Option 2: Jitsi Meet API (More Control)
Use Jitsi's JavaScript API for better control (similar to Daily.co).

## Implementation Steps

### Step 1: Install Jitsi Meet SDK (Optional - for API control)
```bash
npm install @jitsi/react-sdk
# OR
npm install lib-jitsi-meet
```

### Step 2: Update Frontend Components

Replace Daily.co with Jitsi Meet in:
- `frontend/src/components/ActiveSession.jsx`
- `frontend/src/components/ProviderActiveSession.jsx`

### Step 3: Update Backend Service

Replace `backend/authentication/services/dailyVideoService.js` with a Jitsi service.

## Room Name Generation
Jitsi uses room names in the URL. Generate unique room names like:
- `aarohaa-booking-123` (for booking ID 123)
- Use booking ID + timestamp for uniqueness

## Security Considerations
- For private rooms, use Jitsi's password protection
- Or self-host Jitsi for full control
- Room names should be unique and not easily guessable

## Free Cloud vs Self-Hosted

### Free Cloud (meet.jit.si)
- ✅ Zero setup
- ✅ Free forever
- ⚠️ Room names are public (use long random names)
- ⚠️ Limited customization

### Self-Hosted
- ✅ Full control
- ✅ Custom domain
- ✅ Better privacy
- ⚠️ Requires server setup

## Next Steps
See the example implementation files for code changes.
