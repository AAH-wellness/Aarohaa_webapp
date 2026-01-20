## Aarohaa Webapp (Frontend + Backend)

This repo contains:
- **Frontend**: `frontend/` (Vite + React)
- **Backend**: `backend/authentication/` (Node/Express “User/Auth” service)

### Prerequisites
- **Node.js**: 18+ (recommended: 20+)
- **npm**: comes with Node
- **Postgres/Supabase**: database connection details
- (Optional) **Daily**: for embedded video calling

### Quick start (local dev)

- **1) Install dependencies**

```bash
cd frontend
npm install
```

```bash
cd ../backend/authentication
npm install
```

- **2) Configure environment**

Create `backend/authentication/.env` (do **not** commit it). Minimum required:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (recommended for Supabase)
DATABASE_URL=postgresql://...
DB_SSL=true

# JWT
JWT_SECRET=replace-with-secure-random
JWT_EXPIRES_IN=2h

# Google OAuth (for Google login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Email (required to actually send emails)
EMAIL_HOST=...
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=...
EMAIL_PASSWORD=...
EMAIL_FROM=support1@aarohaa.io
EMAIL_FROM_NAME=Aarohaa Wellness Support
SUPPORT_EMAIL=support1@aarohaa.io

# Embedded video (Daily) — required for in-app calling
DAILY_DOMAIN=aarohaa.daily.co
DAILY_API_KEY=your-daily-api-key
```

Create `frontend/.env` (optional; defaults to localhost):

```env
VITE_USER_SERVICE_URL=http://localhost:3001/api
VITE_USE_MOCK_SERVICES=false
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

- **3) Run backend**

```bash
cd backend/authentication
npm run dev
```

- **4) Run frontend**

```bash
cd frontend
npm run dev
```

Open: `http://localhost:5173`

### Notes for developers
- **Provider bookings sync warning**
  - If you see: “bookings in `user_bookings` but not in `provider_bookings`…”
  - Run: `node backend/authentication/scripts/sync-provider-bookings.js`
- **Embedded video**
  - Providers are always host (Daily owner token).
  - Join endpoints:
    - `POST /api/users/bookings/:bookingId/video/join`
    - `POST /api/users/bookings/:bookingId/video/complete` (provider-only)

