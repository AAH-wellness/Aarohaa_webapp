# Authentication Service

Authentication service for the Aarohaa Wellness Platform. Handles user registration, login, logout, and profile management.

## Features

- User registration with email and password
- User login (email/password, Google OAuth placeholder, Wallet-based)
- JWT token-based authentication
- Password hashing with bcrypt
- User profile management
- Password reset functionality (placeholder)
- Protected routes with authentication middleware

## Installation

```bash
npm install
```

## Quick Email Setup (Required for Password Reset)

1. **Copy the template file:**
   ```bash
   # Windows PowerShell
   Copy-Item env.template .env
   
   # Or manually create .env file
   ```

2. **Edit `.env` file and add your Gmail credentials:**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   EMAIL_FROM=noreply@aarohaa.com
   EMAIL_FROM_NAME=Aarohaa Wellness
   ```

3. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Enable 2-Step Verification first (if not already enabled)
   - Click "Select app" → "Mail"
   - Click "Select device" → "Other (Custom name)"
   - Enter "Aarohaa Backend"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

4. **Test email configuration:**
   ```bash
   # Start the server
   npm run dev
   
   # In another terminal, test email:
   curl -X POST http://localhost:3001/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@gmail.com"}'
   ```

   Or use Postman/Thunder Client to POST to `http://localhost:3001/api/test-email` with body:
   ```json
   {
     "email": "your-email@gmail.com"
   }
   ```

## Configuration

1. Create a `.env` file in the `authentication` directory with the following variables:

**Required:**
- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `JWT_EXPIRES_IN`: Token expiration time (default: 7d)

**Email Configuration (choose one option):**

**Option 1: Gmail with App Password (Easiest)**
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

**Option 2: Generic SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

**Option 3: SendGrid (Recommended for Production)**
```env
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

**Option 4: AWS SES**
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_FROM=noreply@aarohaa.com
EMAIL_FROM_NAME=Aarohaa Wellness
```

See `README_EMAIL_SETUP.md` for detailed email configuration instructions.

## Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Public Endpoints

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/reset-password` - Reset password with token

### Protected Endpoints (Require Authentication)

- `POST /api/users/logout` - Logout user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## Request/Response Examples

### Register User
```json
POST /api/users/register
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe",
  "role": "user"
}
```

### Login
```json
POST /api/users/login
{
  "email": "user@example.com",
  "password": "Password123",
  "loginMethod": "email"
}
```

### Get Profile (Protected)
```
GET /api/users/profile
Headers: Authorization: Bearer <token>
```

## Data Storage

Uses PostgreSQL database for persistent storage. See `POSTGRESQL_SETUP.md` for database setup instructions.

### Database Schema
- **users** - User accounts (email, OAuth, wallet)
- **password_reset_codes** - Password reset verification codes

### Migration from In-Memory
If you were using in-memory storage, run the migration script to transfer data to PostgreSQL.

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- CORS is enabled for cross-origin requests
- Input validation using express-validator

## Next Steps

1. Integrate with database (MongoDB/PostgreSQL)
2. Implement email service for password reset
3. Add rate limiting
4. Implement refresh tokens
5. Add OAuth integration (Google)
6. Add wallet-based authentication

