# Aarohaa Wellness Web App - User Stories

## Project Overview
Aarohaa Wellness is a comprehensive wellness platform that connects users with wellness professionals, tracks wellness activities, manages appointments, and integrates blockchain wallet functionality with an AAH Coins reward system.

---

## 1. Authentication & User Management

### US-001: User Registration
**As a** new user  
**I want to** create an account with email and password  
**So that** I can access the wellness platform

**Acceptance Criteria:**
- User can register with full name, email, password, and confirm password
- Form validates email format, password strength (min 6 characters), and password match
- CAPTCHA verification is required during registration
- User can toggle password visibility
- "Remember password" option saves email for 30 days
- Registration automatically logs in the user
- User data is stored in localStorage

### US-002: User Login
**As a** registered user  
**I want to** log in to my account  
**So that** I can access my wellness dashboard

**Acceptance Criteria:**
- User can log in with email and password
- Form validates email format and password (min 6 characters)
- "Remember for 30 days" option saves login credentials
- User can toggle password visibility
- "Forgot password" link is available (placeholder functionality)
- Login success shows animation before redirecting to dashboard
- Login status is stored in localStorage

### US-003: Google OAuth Login
**As a** user  
**I want to** sign in with my Google account  
**So that** I can quickly access the platform without creating a new account

**Acceptance Criteria:**
- Google login button is available on login page
- Clicking Google login triggers OAuth flow (placeholder implementation)
- Successful Google login stores login method in localStorage
- User is redirected to dashboard after successful login

### US-004: Wallet-Based Login
**As a** crypto wallet user  
**I want to** connect my Solana wallet to log in  
**So that** I can access the platform using blockchain authentication

**Acceptance Criteria:**
- "Connect Wallet" button is available on login page
- System detects available Solana wallets (Phantom, Solflare, Backpack)
- User can select from available wallets
- Wallet connection request is sent to selected wallet
- Successful connection stores wallet address and network in localStorage
- User is redirected to dashboard after successful wallet connection
- If no wallets are detected, user sees installation instructions

### US-005: User Sign Out
**As a** logged-in user  
**I want to** sign out of my account  
**So that** I can securely end my session

**Acceptance Criteria:**
- Sign out option is available in user profile dropdown
- Confirmation dialog appears before signing out
- Sign out clears login status from localStorage
- User is redirected to login page after sign out
- Appointments data can optionally be preserved (current implementation)

---

## 2. Provider Discovery & Booking

### US-006: Browse Wellness Providers
**As a** user  
**I want to** view available wellness professionals  
**So that** I can choose a provider for my session

**Acceptance Criteria:**
- Provider cards display name, title, rating, reviews, and price per minute
- Each provider shows their specialization/description
- Providers are displayed in a grid layout
- User can see provider avatars with initials
- "Book Session" button is available on each provider card

### US-007: Book Appointment
**As a** user  
**I want to** book an appointment with a wellness provider  
**So that** I can schedule a consultation session

**Acceptance Criteria:**
- User can select provider from dropdown (pre-filled if coming from provider page)
- User can select date and time using datetime picker
- Minimum date/time is set to current date/time
- User can choose session type (Video Consultation, Phone Consultation, In-Person)
- User can add optional notes about what to discuss
- Form validates all required fields
- Successful booking shows success modal
- Appointment is saved to localStorage
- User can navigate to "My Appointments" from success modal

### US-008: View My Appointments
**As a** user  
**I want to** see my upcoming appointments  
**So that** I can track my scheduled sessions

**Acceptance Criteria:**
- Appointments are loaded from localStorage
- Only upcoming appointments are displayed (past appointments filtered out)
- Appointments are sorted by date/time (soonest first)
- Each appointment card shows provider name, avatar, date/time, and session type
- Relative time display (e.g., "In 2 days", "Tomorrow", "In 3 hours")
- Full date/time is also displayed
- "Join Session" button is available for each appointment
- "Cancel Session" button is available with appropriate warning for late cancellations

### US-009: Cancel Appointment
**As a** user  
**I want to** cancel an appointment  
**So that** I can manage my schedule

**Acceptance Criteria:**
- User can cancel any upcoming appointment
- Cancellation within 2 hours of appointment time shows warning about 10 AAH token penalty
- User must confirm cancellation
- Cancelled appointment is removed from localStorage
- Appointment list updates immediately after cancellation
- Token deduction is noted (implementation placeholder)

### US-010: Appointment Reminder
**As a** user  
**I want to** receive reminders for upcoming appointments  
**So that** I don't miss my sessions

**Acceptance Criteria:**
- Reminder appears when appointment is within 30 minutes
- Reminder shows provider name and time remaining
- Reminder can be dismissed by clicking close button
- Reminder automatically checks every minute
- Reminder disappears after appointment time passes

---

## 3. Active Video Sessions

### US-011: Start Video Session
**As a** user with a booked appointment  
**I want to** start a video call session  
**So that** I can have my consultation

**Acceptance Criteria:**
- "Active Session" page is only accessible if user has booked appointments
- If no appointment is booked, modal prompts user to book first
- Pre-call screen shows placeholder with provider name
- "Start Call" button initiates webcam and microphone access
- User must grant camera and microphone permissions
- Video stream starts playing after permissions granted
- Loading state is shown while starting call

### US-012: Video Call Controls
**As a** user in an active video session  
**I want to** control my video and audio  
**So that** I can manage my privacy and connection quality

**Acceptance Criteria:**
- Mute/unmute button toggles microphone
- Video on/off button toggles camera
- Visual indicators show when mic/video are disabled
- End call button terminates the session
- Confirmation dialog appears before ending call
- Video stream is properly cleaned up when call ends

### US-013: Session Timer & Cost Tracking
**As a** user in an active video session  
**I want to** see session duration and cost  
**So that** I can track my session time and expenses

**Acceptance Criteria:**
- Timer starts when call begins
- Timer displays in MM:SS format
- Cost is calculated based on provider's per-minute rate (e.g., $3/min for Dr. Maya Patel)
- Cost updates in real-time as session progresses
- Timer and cost are displayed in session info bar

### US-014: Session Notes
**As a** user in an active video session  
**I want to** take notes during my session  
**So that** I can remember important points discussed

**Acceptance Criteria:**
- Notes textarea is available during active session
- User can type notes in real-time
- Notes persist during the session
- Notes are saved locally (localStorage implementation can be added)

---

## 4. Wellness Activities

### US-015: View Prescribed Activities
**As a** user  
**I want to** see wellness activities assigned to me  
**So that** I can complete them to earn rewards

**Acceptance Criteria:**
- Activities are displayed in a grid layout
- Each activity card shows icon, title, description, and reward amount
- Activities include: Daily Meditation, Walking Exercise, Gratitude Journal, Hydration Goal
- Reward amounts are displayed in AAH Coins
- Action button is available for each activity (e.g., "Start Meditation", "Track Walk")

### US-016: Complete Wellness Activities
**As a** user  
**I want to** complete wellness activities  
**So that** I can earn AAH Coins

**Acceptance Criteria:**
- User can click activity buttons to start/track activities
- Activity completion tracking (implementation placeholder)
- AAH Coins are awarded upon completion
- Coin balance updates in header

---

## 5. Courses & Content

### US-017: Access Courses & Content
**As a** user  
**I want to** access educational courses and content  
**So that** I can learn about wellness topics

**Acceptance Criteria:**
- "Courses & Content" section is accessible from sidebar
- Coming soon message is displayed with animated Lottie icon
- Placeholder indicates future content availability

---

## 6. Support & Messaging

### US-018: Contact Support
**As a** user  
**I want to** send messages to support  
**So that** I can get help or provide feedback

**Acceptance Criteria:**
- Contact form includes: name, email, message type, subject, and message fields
- Message types: Feedback, Complaint, Question, Suggestion, Other
- Form validates all required fields and email format
- Success modal appears after submission
- Message is saved to localStorage
- Form resets after successful submission

---

## 7. Profile Management

### US-019: View Profile Information
**As a** user  
**I want to** view my profile information  
**So that** I can see my account details

**Acceptance Criteria:**
- Profile page displays personal information: name, email, phone, date of birth, address
- KYC verification status is displayed (Verified/Not Verified)
- Verification status depends on wallet connection
- Profile information is read-only (editing not yet implemented)

### US-020: Connect Wallet in Profile
**As a** user  
**I want to** connect my Solana wallet in my profile  
**So that** I can verify my account and access blockchain features

**Acceptance Criteria:**
- Wallet section shows connection status
- "Connect Wallet" button is available if wallet not connected
- Wallet modal shows available Solana wallets
- Connected wallet displays address, network, and balance
- Wallet address can be copied to clipboard
- Balance is fetched from Solana blockchain
- Wallet connection persists across sessions

### US-021: Reset Password
**As a** user  
**I want to** change my password  
**So that** I can maintain account security

**Acceptance Criteria:**
- "Reset Password" button is available in Security section
- Form requires current password, new password, and confirmation
- New password must be at least 8 characters
- Passwords must match
- Success message appears after password reset
- Form can be cancelled

---

## 8. Navigation & UI

### US-022: Dashboard Navigation
**As a** user  
**I want to** navigate between different sections  
**So that** I can access all features of the platform

**Acceptance Criteria:**
- Sidebar navigation includes: Find Providers, My Appointments, Active Session, Wellness Activities, Courses & Content, Support
- Active section is highlighted in sidebar
- Clicking sidebar items changes the main content view
- Header displays logo and user profile dropdown

### US-023: View AAH Coins Balance
**As a** user  
**I want to** see my AAH Coins balance  
**So that** I can track my rewards

**Acceptance Criteria:**
- Coin balance is displayed in header (currently shows "1,250 AAH Coins")
- Balance is visible on all pages except Profile page
- Coin icon is displayed next to balance

### US-024: User Profile Dropdown
**As a** user  
**I want to** access profile and sign out options  
**So that** I can manage my account

**Acceptance Criteria:**
- User avatar with initials is displayed in header
- Clicking avatar opens dropdown menu
- Dropdown includes: Profile and Sign Out options
- Dropdown closes when clicking outside
- Clicking Profile navigates to Profile page
- Clicking Sign Out triggers sign out flow

---

## 9. Data Persistence

### US-025: Local Storage Management
**As a** user  
**I want to** have my data persist across sessions  
**So that** I don't lose my appointments and preferences

**Acceptance Criteria:**
- Appointments are stored in localStorage
- Login status is stored in localStorage
- Wallet connection data is stored in localStorage
- User preferences (remember email) are stored
- Messages/contact forms are stored in localStorage
- Data persists after page refresh

---

## 10. Technical Features

### US-026: Responsive Design
**As a** user  
**I want to** use the app on different screen sizes  
**So that** I can access it from any device

**Acceptance Criteria:**
- App is responsive and works on desktop, tablet, and mobile
- UI elements adapt to screen size
- Navigation remains accessible on all devices

### US-027: WebRTC Video Integration
**As a** user  
**I want to** have video calls with providers  
**So that** I can have face-to-face consultations

**Acceptance Criteria:**
- WebRTC getUserMedia API is used for video/audio access
- Video stream is displayed in video element
- Stream cleanup happens properly when call ends
- Error handling for permission denials

### US-028: Solana Blockchain Integration
**As a** user  
**I want to** connect my Solana wallet  
**So that** I can use blockchain features

**Acceptance Criteria:**
- App detects Phantom, Solflare, and Backpack wallets
- Wallet connection uses Solana wallet adapter
- Balance is fetched from Solana RPC endpoint
- Wallet events (disconnect, account change) are handled

---

## Current Implementation Status

### ✅ Fully Implemented
- User registration with CAPTCHA
- User login (email/password, Google placeholder, Wallet)
- Provider browsing and booking
- Appointment management (view, cancel)
- Active video sessions with controls
- Wellness activities display
- Support contact form
- Profile management
- Wallet connection
- Navigation and UI components
- Local storage persistence

### 🚧 Partially Implemented / Placeholders
- Google OAuth (placeholder alert)
- Activity completion tracking (buttons present, tracking not implemented)
- Token deduction for late cancellations (warning shown, deduction not implemented)
- Courses & Content (coming soon page)
- Password reset (form works, backend integration needed)
- Session notes persistence (local storage not implemented)

### 📋 Future Enhancements (Noted in Code)
- Backend API integration
- Real-time video calling with providers
- Activity tracking functionality
- Coin redemption system
- Premium UI design improvements
- User authentication backend
- Appointment reminders via notifications
- Payment processing integration

---

## Technical Stack
- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Styling:** CSS3 (Custom CSS files)
- **Animation:** Lottie Files (@lottiefiles/dotlottie-react)
- **Blockchain:** Solana (Wallet Adapter)
- **Storage:** localStorage (Frontend only)
- **Video:** WebRTC (getUserMedia API)

---

## User Flow Summary

1. **New User:** Register → Login → Browse Providers → Book Appointment → Join Session
2. **Returning User:** Login → View Appointments → Start Session / Book New Appointment
3. **Wellness Tracking:** View Activities → Complete Activities → Earn AAH Coins
4. **Support:** Navigate to Support → Fill Contact Form → Submit Message
5. **Profile Management:** View Profile → Connect Wallet → Reset Password (optional)

---

*Document generated based on codebase analysis as of current implementation*

