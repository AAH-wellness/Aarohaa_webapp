# Aarohaa Wellness Web App

A modern wellness application for managing and tracking wellness activities with AAH Coins reward system.

## Features

- **Dashboard Navigation**: Easy access to all app sections
- **Wellness Activities**: Track and complete prescribed wellness activities
- **AAH Coins System**: Earn rewards for completing activities
- **Modern UI**: Clean and intuitive interface with purple gradient theme

## Project Structure

This project is part of a monorepo structure:
- **Frontend**: `E:\Work\Workspace\MASTERS\Aarohaa Webapp frontend` (this folder)
- **Backend**: `E:\Work\Workspace\MASTERS\Aarohaa Webapp backend`

The frontend is configured to connect to backend microservices running on different ports.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend services running (see Backend Connection section)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure backend connection (optional - uses mock services by default):
   - Create a `.env` file in the project root
   - See `.env.example` for configuration options
   - Or see `MICROSERVICES_MIGRATION_GUIDE.md` for detailed setup

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Backend Connection

The frontend is configured to connect to backend microservices located at:
**Backend Folder**: `E:\Work\Workspace\MASTERS\Aarohaa Webapp backend`

### Backend Services

The frontend expects the following microservices:
- **User Service**: `http://localhost:3001/api`
- **Appointment Service**: `http://localhost:3002/api`
- **Provider Service**: `http://localhost:3003/api`
- **Payment Service**: `http://localhost:3004/api`
- **Admin Service**: `http://localhost:3005/api`
- **Notification Service**: `http://localhost:3006/api`
- **Analytics Service**: `http://localhost:3007/api`

### Development Mode

By default, the frontend uses **mock services** (localStorage-based) for development. This allows frontend development without requiring the backend to be running.

To connect to real backend services:
1. Ensure backend services are running
2. Create a `.env` file with service URLs
3. Set `VITE_USE_MOCK_SERVICES=false`

See `MICROSERVICES_MIGRATION_GUIDE.md` for detailed integration instructions.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── Header.jsx          # Top header with logo, coins, and user profile
│   ├── Header.css
│   ├── Sidebar.jsx         # Left navigation sidebar
│   ├── Sidebar.css
│   ├── WellnessActivities.jsx  # Main wellness activities section
│   └── WellnessActivities.css
├── App.jsx                 # Main app component
├── App.css
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## Technologies Used

- React 18
- Vite (Build tool)
- CSS3 (Custom styling)

## Future Enhancements

- Premium UI design improvements
- User authentication
- Backend integration
- Activity tracking functionality
- Coin redemption system


