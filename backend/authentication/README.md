# Authentication Service

Authentication microservice for the Aarohaa Wellness Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example` if available):
```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-secret-key-change-in-production
```

3. Start the development server:
```bash
npm run dev
```

Or from the backend root:
```bash
npm run dev
```

## API Endpoints

- **Health Check**: `GET /health`
- **API Base**: `GET /api`

## Project Structure

```
authentication/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
├── validators/      # Input validation
├── server.js        # Main server file
└── package.json     # Dependencies
```

## Port

Default port: **3001**

This matches the User Service port as defined in the frontend configuration.

