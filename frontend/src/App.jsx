import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import WellnessActivities from './components/WellnessActivities'
import FindProviders from './components/FindProviders'
import MyAppointments from './components/MyAppointments'
import BookAppointment from './components/BookAppointment'
import CoursesContent from './components/CoursesContent'
import ActiveSession from './components/ActiveSession'
import Messages from './components/Messages'
import Profile from './components/Profile'
import Login from './components/Login'
import Register from './components/Register'
import ProviderLogin from './components/ProviderLogin'
// Provider components
import ProviderHeader from './components/ProviderHeader'
import ProviderSidebar from './components/ProviderSidebar'
import ProviderDashboard from './components/ProviderDashboard'
import ProviderAppointments from './components/ProviderAppointments'
import ProviderActiveSession from './components/ProviderActiveSession'
import ProviderProfile from './components/ProviderProfile'
import ProviderEarnings from './components/ProviderEarnings'
import ProviderAvailability from './components/ProviderAvailability'
import ProviderNotifications from './components/ProviderNotifications'
import ProviderPaymentMethods from './components/ProviderPaymentMethods'
import ProviderGoogleOnboardingModal from './components/ProviderGoogleOnboardingModal'
// Admin components
import AdminHeader from './components/AdminHeader'
import AdminSidebar from './components/AdminSidebar'
import AdminDashboard from './components/AdminDashboard'
import AdminUsers from './components/AdminUsers'
import AdminProviders from './components/AdminProviders'
import AdminAppointments from './components/AdminAppointments'
import AdminSessions from './components/AdminSessions'
import AdminAnalytics from './components/AdminAnalytics'
import AdminSettings from './components/AdminSettings'
import AdminAuditLog from './components/AdminAuditLog'
import AdminProfile from './components/AdminProfile'
import MaintenanceMode from './components/MaintenanceMode'
import ForgotPasswordModal from './components/ForgotPasswordModal'
import ResetPassword from './components/ResetPassword'
import NotificationTicker from './components/NotificationTicker'
import ThemeAwareBackground from './components/ThemeAwareBackground'
import { UserNotificationProvider } from './contexts/UserNotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { authService } from './services'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showProviderLogin, setShowProviderLogin] = useState(false)
  const [loginMode, setLoginMode] = useState('user') // 'user', 'provider', or 'admin'
  const [userRole, setUserRole] = useState('user') // 'user', 'provider', or 'admin'
  const [activeView, setActiveView] = useState('My Appointments')
  const [providerActiveView, setProviderActiveView] = useState('Dashboard')
  const [providerActiveSession, setProviderActiveSession] = useState(null)
  const [adminActiveView, setAdminActiveView] = useState('Dashboard')
  const [hasBookedSession, setHasBookedSession] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false)
  const [isProviderSidebarOpen, setIsProviderSidebarOpen] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [providerNeedsOnboarding, setProviderNeedsOnboarding] = useState(false)

  useEffect(() => {
    const logError = (message, stack) => {
      try {
        localStorage.setItem('lastAppCrash', JSON.stringify({
          message,
          stack,
          time: new Date().toISOString()
        }))
      } catch (error) {
        console.warn('Unable to persist crash info:', error)
      }
    }

    const handleWindowError = (event) => {
      logError(event.message || 'Unknown error', event.error?.stack || '')
    }

    const handleUnhandledRejection = (event) => {
      logError(event.reason?.message || 'Unhandled rejection', event.reason?.stack || '')
    }

    // Check maintenance mode status
    const checkMaintenanceMode = () => {
      const platformSettings = JSON.parse(localStorage.getItem('platformSettings') || '{}')
      setMaintenanceMode(platformSettings.maintenanceMode === true)
    }
    
    checkMaintenanceMode()
    
    // Validate token on app load
    const validateTokenOnLoad = async () => {
      const token = authService.getAuthToken()
      const storedLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      const role = localStorage.getItem('userRole') || 'user'
      
      // If no token but marked as logged in, clear invalid state
      if (!token && storedLoggedIn) {
        console.warn('Token missing but user marked as logged in, clearing auth state')
        authService.clearAuthData()
        setIsLoggedIn(false)
        setUserRole('user')
        return
      }
      
      // If token exists, validate it
      if (token) {
        const validation = authService.validateToken(token)
        
        if (!validation.isValid) {
          // Token is expired or invalid
          console.warn('Token validation failed on app load:', validation.reason, validation.message)
          authService.clearAuthData()
          setIsLoggedIn(false)
          setUserRole('user')
          return
        }
        
        // Token is valid, set logged in state
        setIsLoggedIn(true)
        setUserRole(role)
        
        // Set default view based on role
        if (role === 'provider') {
          const needsOnboarding =
            localStorage.getItem('loginMethod') === 'google' &&
            localStorage.getItem('profileIncomplete') === 'true'
          setProviderNeedsOnboarding(needsOnboarding)
          setProviderActiveView(needsOnboarding ? 'Profile' : 'Dashboard')
        } else if (role === 'admin') {
          setAdminActiveView('Dashboard')
        } else {
          setActiveView('My Appointments')
        }
      } else {
        // No token, user is not logged in
        setIsLoggedIn(false)
        setUserRole('user')
      }
    }
    
    // Run token validation
    validateTokenOnLoad()
    
    // Check if there are any appointments in localStorage
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]')
    if (appointments.length > 0) {
      setHasBookedSession(true)
    }

    // Listen for auth logout events (from API client)
    const handleAuthLogout = (event) => {
      console.log('Auth logout event received:', event.detail)
      setIsLoggedIn(false)
      setUserRole('user')
      setShowRegister(false)
      setActiveView('My Appointments')
      setProviderActiveView('Dashboard')
      setProviderActiveSession(null)
      setProviderNeedsOnboarding(false)
    }
    window.addEventListener('auth:logout', handleAuthLogout)

    // Listen for storage changes to update maintenance mode in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'platformSettings') {
        checkMaintenanceMode()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for changes (in case settings are changed in same tab)
    const interval = setInterval(checkMaintenanceMode, 1000)

    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      clearInterval(interval)
    }
  }, [])

  const handleBookSession = (providerValue) => {
    setSelectedProvider(providerValue)
    setActiveView('Book Appointment')
  }

  const handleBookingConfirmed = () => {
    setHasBookedSession(true)
    setSelectedProvider(null)
  }

  const handleNavigateToAppointments = () => {
    setActiveView('My Appointments')
  }

  const renderContent = () => {
    switch (activeView) {
      case 'Find Providers':
        return <FindProviders onBookSession={handleBookSession} onNavigateToAppointments={handleNavigateToAppointments} />
      case 'Book Appointment':
        return (
          <BookAppointment
            selectedProvider={selectedProvider}
            onBookingConfirmed={handleBookingConfirmed}
            onNavigateToAppointments={handleNavigateToAppointments}
          />
        )
      case 'My Appointments':
        return <MyAppointments 
          onJoinSession={(appointment) => {
            setActiveSession(appointment)
            setActiveView('Active Session')
          }}
          onSessionCancelled={(bookingId) => {
            // If the cancelled session was the active one, clear it
            if (activeSession && activeSession.id === bookingId) {
              setActiveSession(null)
              // If currently on Active Session tab, redirect to My Appointments
              if (activeView === 'Active Session') {
                setActiveView('My Appointments')
              }
            }
          }}
        />
      case 'Active Session':
        return (
          <ActiveSession
            hasBookedSession={hasBookedSession}
            onNavigateToBooking={() => {
              setActiveView('Find Providers')
              setActiveSession(null)
            }}
            onActiveSessionChange={(sessionData) => {
              setActiveSession(sessionData)
              // Don't redirect - just update the session state
              // The modal will show if there's no session
            }}
            selectedAppointment={activeSession}
          />
        )
      case 'Wellness Activities':
        return <WellnessActivities />
      case 'Courses & Content':
        return <CoursesContent />
      case 'Support':
        return <Messages />
      case 'Profile':
        return <Profile />
      default:
        return <MyAppointments />
    }
  }

  const handleNavigateToProfile = () => {
    setActiveView('Profile')
  }

  const handleLogin = () => {
    const role = localStorage.getItem('userRole') || 'user'
    console.log('Login - User role:', role)
    setIsLoggedIn(true)
    setUserRole(role)
    setShowRegister(false)
    
    // Navigate to appropriate dashboard based on role
    if (role === 'provider') {
      console.log('Navigating to provider dashboard')
      const needsOnboarding =
        localStorage.getItem('loginMethod') === 'google' &&
        localStorage.getItem('profileIncomplete') === 'true'
      setProviderNeedsOnboarding(needsOnboarding)
      setProviderActiveView(needsOnboarding ? 'Profile' : 'Dashboard')
    } else if (role === 'admin') {
      console.log('Navigating to admin dashboard')
      setAdminActiveView('Dashboard')
    } else {
      // Default to user view
      console.log('Navigating to user dashboard')
      setActiveView('My Appointments')
    }
  }

  const handleRegister = () => {
    const role = localStorage.getItem('userRole') || 'user'
    setIsLoggedIn(true)
    setUserRole(role)
    setShowRegister(false)
    
    // Navigate to appropriate dashboard based on role
    if (role === 'provider') {
      const needsOnboarding =
        localStorage.getItem('loginMethod') === 'google' &&
        localStorage.getItem('profileIncomplete') === 'true'
      setProviderNeedsOnboarding(needsOnboarding)
      setProviderActiveView(needsOnboarding ? 'Profile' : 'Dashboard')
    } else if (role === 'admin') {
      setAdminActiveView('Dashboard')
    } else {
      // Default to user view
      setActiveView('My Appointments')
    }
  }

  const handleNavigateToRegister = () => {
    setShowRegister(true)
  }

  const handleNavigateToLogin = () => {
    setShowRegister(false)
    setShowProviderLogin(false)
  }

  const handleNavigateToProviderLogin = () => {
    setShowProviderLogin(true)
    setShowRegister(false)
  }

  const handleNavigateToUserLogin = () => {
    setShowProviderLogin(false)
  }

  const handleForgotPassword = () => {
    setShowForgotPassword(true)
  }

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      // Clear all auth data using centralized service
      authService.clearAuthData()
      
      // Update state
      setIsLoggedIn(false)
      setShowRegister(false)
      setUserRole('user')
      setActiveView('My Appointments')
      setProviderActiveView('Dashboard')
      setProviderActiveSession(null)
      setProviderNeedsOnboarding(false)
    }
  }

  const renderProviderContent = () => {
    switch (providerActiveView) {
      case 'Dashboard':
        return <ProviderDashboard 
          onJoinSession={(appointment) => {
            setProviderActiveSession(appointment)
            setProviderActiveView('Active Sessions')
          }}
          onNavigateToSchedule={() => setProviderActiveView('My Schedule')}
          onNavigateToEarnings={() => setProviderActiveView('Earnings')}
          onNavigateToProfile={() => setProviderActiveView('Profile')}
        />
      case 'My Schedule':
        return <ProviderAppointments onJoinSession={(appointment) => {
          setProviderActiveSession(appointment)
          setProviderActiveView('Active Sessions')
        }} />
      case 'Active Sessions':
        return (
          <ProviderActiveSession 
            selectedAppointment={providerActiveSession}
            onSessionCompleted={() => {
              // Clear active session after completion
              setProviderActiveSession(null)
              // Optionally navigate back to dashboard
              // setProviderActiveView('Dashboard')
            }}
          />
        )
      case 'Earnings':
        return <ProviderEarnings />
      case 'Profile':
        return (
          <ProviderProfile
            onNavigateToAvailability={() => {
              // Debounce rapid navigation and defer to next frame to prevent crashes
              const now = Date.now()
              if (!window.lastNavigationTime || now - window.lastNavigationTime > 500) {
                window.lastNavigationTime = now
                // Use setTimeout to allow current render cycle to complete
                setTimeout(() => {
                  try {
                    setProviderActiveView('Availability')
                  } catch (error) {
                    console.error('Error navigating to availability:', error)
                  }
                }, 0)
              }
            }}
            onNavigateToNotifications={() => setProviderActiveView('Notifications')}
            onNavigateToPaymentMethods={() => setProviderActiveView('Payment Methods')}
          />
        )
      case 'Availability':
        return (
          <ProviderAvailability 
            key="provider-availability-view"
            onBack={() => {
              // Prevent rapid navigation that could cause crashes
              setTimeout(() => {
                try {
                  setProviderActiveView('Profile')
                } catch (error) {
                  console.error('Error navigating back from availability:', error)
                }
              }, 0)
            }} 
          />
        )
      case 'Notifications':
        return <ProviderNotifications onBack={() => setProviderActiveView('Profile')} />
      case 'Payment Methods':
        return <ProviderPaymentMethods onBack={() => setProviderActiveView('Profile')} />
      default:
        return <ProviderDashboard />
    }
  }

  const renderAdminContent = () => {
    switch (adminActiveView) {
      case 'Dashboard':
        return <AdminDashboard />
      case 'Users':
        return <AdminUsers />
      case 'Providers':
        return <AdminProviders />
      case 'Appointments':
        return <AdminAppointments />
      case 'Sessions':
        return <AdminSessions />
      case 'Analytics':
        return <AdminAnalytics />
      case 'Audit Log':
        return <AdminAuditLog />
      case 'Settings':
        return <AdminSettings />
      case 'Profile':
        return <AdminProfile />
      default:
        return <AdminDashboard />
    }
  }

  // Check maintenance mode - block non-admin users if enabled
  if (maintenanceMode && userRole !== 'admin') {
    return <MaintenanceMode />
  }

  // Check if user is on reset password page (has token in URL)
  const urlParams = new URLSearchParams(window.location.search)
  const resetToken = urlParams.get('token')

  // Show reset password page if token is in URL
  if (resetToken && !isLoggedIn) {
    return (
      <ResetPassword
        token={resetToken}
        onSuccess={() => {
          // Clear token from URL - this will cause the component to re-render and show login page
          window.history.replaceState({}, document.title, window.location.pathname)
          // Force a re-render by updating state (App will show login page since resetToken will be null)
          window.location.reload()
        }}
        onClose={() => {
          // Clear token and navigate to login
          window.history.replaceState({}, document.title, window.location.pathname)
          window.location.reload()
        }}
      />
    )
  }

  // Show login/register page if not logged in
  if (!isLoggedIn) {
    return (
      <>
        <Login
          onLogin={handleLogin}
          onNavigateToRegister={handleNavigateToRegister}
          onForgotPassword={handleForgotPassword}
          loginMode={loginMode}
          onToggleMode={(mode) => setLoginMode(mode)}
        />
        {showForgotPassword && (
          <ForgotPasswordModal
            onClose={() => setShowForgotPassword(false)}
            role={loginMode === 'provider' ? 'provider' : 'user'}
          />
        )}
        {showRegister && (
          <div className="register-modal-overlay" onClick={handleNavigateToLogin}>
            <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
              <Register
                onRegister={handleRegister}
                onNavigateToLogin={handleNavigateToLogin}
                registrationMode={loginMode === 'provider' ? 'provider' : 'user'}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  // Render admin dashboard if role is admin
  if (userRole === 'admin') {
    return (
      <div className="app">
        <AdminHeader 
          onSignOut={handleSignOut}
          activeView={adminActiveView}
          setActiveView={setAdminActiveView}
          onToggleSidebar={() => setIsAdminSidebarOpen(!isAdminSidebarOpen)}
          isSidebarOpen={isAdminSidebarOpen}
        />
        {isAdminSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsAdminSidebarOpen(false)}
          ></div>
        )}
        <div className="app-body">
          <AdminSidebar 
            activeView={adminActiveView} 
            setActiveView={setAdminActiveView}
            isMobileOpen={isAdminSidebarOpen}
            onCloseSidebar={() => setIsAdminSidebarOpen(false)}
          />
          <main className="main-content">
            <div className="network-nodes">
              <div className="network-node" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
              <div className="network-node" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }}></div>
              <div className="network-node" style={{ top: '50%', left: '20%', animationDelay: '1s' }}></div>
              <div className="network-node" style={{ top: '70%', left: '75%', animationDelay: '1.5s' }}></div>
              <div className="network-node" style={{ top: '35%', left: '50%', animationDelay: '2s' }}></div>
              <div className="network-node" style={{ top: '60%', left: '10%', animationDelay: '2.5s' }}></div>
              <div className="network-node" style={{ top: '15%', left: '60%', animationDelay: '0.3s' }}></div>
              <div className="network-node" style={{ top: '80%', left: '40%', animationDelay: '0.8s' }}></div>
              
              <div className="network-connection" style={{ 
                top: '12%', 
                left: '15%', 
                width: '65%', 
                transform: 'rotate(15deg)',
                animationDelay: '0s'
              }}></div>
              <div className="network-connection" style={{ 
                top: '30%', 
                left: '20%', 
                width: '55%', 
                transform: 'rotate(-20deg)',
                animationDelay: '1s'
              }}></div>
              <div className="network-connection" style={{ 
                top: '55%', 
                left: '10%', 
                width: '70%', 
                transform: 'rotate(10deg)',
                animationDelay: '2s'
              }}></div>
              <div className="network-connection" style={{ 
                top: '75%', 
                left: '25%', 
                width: '50%', 
                transform: 'rotate(-15deg)',
                animationDelay: '1.5s'
              }}></div>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderAdminContent()}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Render provider dashboard if role is provider
  if (userRole === 'provider') {
    return (
      <div className="app">
        {providerNeedsOnboarding && (
          <ProviderGoogleOnboardingModal
            onSignOut={handleSignOut}
            onCompleted={() => {
              setProviderNeedsOnboarding(false)
              setProviderActiveView('Dashboard')
            }}
          />
        )}
        <ProviderHeader 
          onNavigateToProfile={() => setProviderActiveView('Profile')}
          onSignOut={handleSignOut}
          activeView={providerActiveView}
          onToggleSidebar={() => setIsProviderSidebarOpen(!isProviderSidebarOpen)}
          isSidebarOpen={isProviderSidebarOpen}
        />
        {isProviderSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsProviderSidebarOpen(false)}
          ></div>
        )}
        <div className="app-body">
          <ProviderSidebar 
            activeView={providerActiveView} 
            setActiveView={setProviderActiveView}
            isMobileOpen={isProviderSidebarOpen}
            onCloseSidebar={() => setIsProviderSidebarOpen(false)}
          />
          <main className="main-content">
            <div className="network-nodes">
              <div className="network-node" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
              <div className="network-node" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }}></div>
              <div className="network-node" style={{ top: '50%', left: '20%', animationDelay: '1s' }}></div>
              <div className="network-node" style={{ top: '70%', left: '75%', animationDelay: '1.5s' }}></div>
              <div className="network-node" style={{ top: '35%', left: '50%', animationDelay: '2s' }}></div>
              <div className="network-node" style={{ top: '60%', left: '10%', animationDelay: '2.5s' }}></div>
              <div className="network-node" style={{ top: '15%', left: '60%', animationDelay: '0.3s' }}></div>
              <div className="network-node" style={{ top: '80%', left: '40%', animationDelay: '0.8s' }}></div>
              
              <div className="network-connection" style={{ 
                top: '12%', 
                left: '15%', 
                width: '65%', 
                transform: 'rotate(15deg)',
                animationDelay: '0s'
              }}></div>
              <div className="network-connection" style={{ 
                top: '30%', 
                left: '20%', 
                width: '55%', 
                transform: 'rotate(-20deg)',
                animationDelay: '1s'
              }}></div>
              <div className="network-connection" style={{ 
                top: '55%', 
                left: '10%', 
                width: '70%', 
                transform: 'rotate(10deg)',
                animationDelay: '2s'
              }}></div>
              <div className="network-connection" style={{ 
                top: '75%', 
                left: '25%', 
                width: '50%', 
                transform: 'rotate(-15deg)',
                animationDelay: '1.5s'
              }}></div>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderProviderContent()}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Render user dashboard
  return (
    <ThemeProvider>
    <UserNotificationProvider>
      <div className="app theme-transition">
        <ThemeAwareBackground />
        <Header 
          onNavigateToProfile={handleNavigateToProfile}
          onSignOut={handleSignOut}
          activeView={activeView}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          activeSession={activeSession}
          showThemeToggle
        />
        {(activeView === 'My Appointments' || activeView === 'Find Providers') && <NotificationTicker />}
        {isSidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        <div className="app-body">
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView}
          isMobileOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
        <main className="main-content">
          <div className="network-nodes">
            <div className="network-node" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
            <div className="network-node" style={{ top: '25%', left: '80%', animationDelay: '0.5s' }}></div>
            <div className="network-node" style={{ top: '50%', left: '20%', animationDelay: '1s' }}></div>
            <div className="network-node" style={{ top: '70%', left: '75%', animationDelay: '1.5s' }}></div>
            <div className="network-node" style={{ top: '35%', left: '50%', animationDelay: '2s' }}></div>
            <div className="network-node" style={{ top: '60%', left: '10%', animationDelay: '2.5s' }}></div>
            <div className="network-node" style={{ top: '15%', left: '60%', animationDelay: '0.3s' }}></div>
            <div className="network-node" style={{ top: '80%', left: '40%', animationDelay: '0.8s' }}></div>
            
            <div className="network-connection" style={{ 
              top: '12%', 
              left: '15%', 
              width: '65%', 
              transform: 'rotate(15deg)',
              animationDelay: '0s'
            }}></div>
            <div className="network-connection" style={{ 
              top: '30%', 
              left: '20%', 
              width: '55%', 
              transform: 'rotate(-20deg)',
              animationDelay: '1s'
            }}></div>
            <div className="network-connection" style={{ 
              top: '55%', 
              left: '10%', 
              width: '70%', 
              transform: 'rotate(10deg)',
              animationDelay: '2s'
            }}></div>
            <div className="network-connection" style={{ 
              top: '75%', 
              left: '25%', 
              width: '50%', 
              transform: 'rotate(-15deg)',
              animationDelay: '1.5s'
            }}></div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
    </UserNotificationProvider>
    </ThemeProvider>
  )
}

export default App
