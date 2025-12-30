import React, { useState, useEffect } from 'react'
import { userService } from './services'
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
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showProviderLogin, setShowProviderLogin] = useState(false)
  const [showProviderRegister, setShowProviderRegister] = useState(false)
  const [loginMode, setLoginMode] = useState('user') // 'user', 'provider', or 'admin'
  const [userRole, setUserRole] = useState('user') // 'user', 'provider', or 'admin'
  const [activeView, setActiveView] = useState('My Appointments')
  const [providerActiveView, setProviderActiveView] = useState('Dashboard')
  const [adminActiveView, setAdminActiveView] = useState('Dashboard')
  const [hasBookedSession, setHasBookedSession] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false)
  const [isProviderSidebarOpen, setIsProviderSidebarOpen] = useState(false)

  useEffect(() => {
    // Check authentication status from API
    const checkAuthStatus = async () => {
      try {
        const userService = (await import('./services/userService.js')).default
        const user = await userService.checkAuthStatus()
        
        if (user) {
          setIsLoggedIn(true)
          setUserRole(user.role || 'user')
          
          // Set default view based on role
          if (user.role === 'provider') {
            setProviderActiveView('Dashboard')
          } else if (user.role === 'admin') {
            setAdminActiveView('Dashboard')
          } else {
            setActiveView('My Appointments')
          }
          
          // Check appointments from API to determine if Active Session should be accessible
          try {
            const appointmentService = (await import('./services/appointmentService.js')).default
            const appointments = await appointmentService.getUpcomingAppointments()
            if (appointments && appointments.length > 0) {
              setHasBookedSession(true)
            } else {
              setHasBookedSession(false)
            }
          } catch (error) {
            console.error('Error checking appointments:', error)
            setHasBookedSession(false)
          }
        } else {
          setIsLoggedIn(false)
          setUserRole('user')
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        setIsLoggedIn(false)
        setUserRole('user')
      }
    }

    checkAuthStatus()
  }, [])

  const handleBookSession = (providerValue) => {
    setSelectedProvider(providerValue)
    setActiveView('Book Appointment')
  }

  const handleBookingConfirmed = async () => {
    // Refresh appointments from API to update hasBookedSession
    try {
      const appointmentService = (await import('./services/appointmentService.js')).default
      const appointments = await appointmentService.getUpcomingAppointments()
      setHasBookedSession(appointments && appointments.length > 0)
    } catch (error) {
      console.error('Error checking appointments after booking:', error)
      // Still set to true if booking was successful
      setHasBookedSession(true)
    }
    setSelectedProvider(null)
  }

  const handleNavigateToAppointments = () => {
    setActiveView('My Appointments')
  }

  const renderContent = () => {
    switch (activeView) {
      case 'Find Providers':
        return <FindProviders onBookSession={handleBookSession} />
      case 'Book Appointment':
        return (
          <BookAppointment
            selectedProvider={selectedProvider}
            onBookingConfirmed={handleBookingConfirmed}
            onNavigateToAppointments={handleNavigateToAppointments}
          />
        )
      case 'My Appointments':
        return <MyAppointments />
      case 'Active Session':
        return (
          <ActiveSession
            hasBookedSession={hasBookedSession}
            onNavigateToBooking={() => setActiveView('Find Providers')}
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
    setIsLoggedIn(true)
    setUserRole(role)
    setShowRegister(false)
    // Always default to user view on login
    setActiveView('My Appointments')
  }

  const handleRegister = async (registeredRole) => {
    // After registration, token is already stored by userService
    // Set logged in state immediately and navigate based on role
    const finalRole = registeredRole || 'user'
    
    // Set login state immediately since token is stored during registration
    setIsLoggedIn(true)
    setUserRole(finalRole)
    setShowRegister(false)
    setShowProviderRegister(false)
    
    // Also store role in localStorage for handleLogin to pick up
    localStorage.setItem('userRole', finalRole)
    
    // Navigate based on role
    if (finalRole === 'provider') {
      setProviderActiveView('Dashboard')
    } else if (finalRole === 'admin') {
      setAdminActiveView('Dashboard')
    } else {
      setActiveView('My Appointments')
    }
  }

  const handleNavigateToRegister = () => {
    // Clear provider states when showing user register
    setShowProviderLogin(false)
    setShowProviderRegister(false)
    setShowRegister(true)
  }

  const handleNavigateToLogin = () => {
    // Clear all register states
    setShowRegister(false)
    setShowProviderRegister(false)
    // Clear provider login if showing
    setShowProviderLogin(false)
  }

  const handleNavigateToProviderLogin = () => {
    // Clear all user-related states first
    setShowRegister(false)
    setLoginMode('user')
    // Then set provider states
    setShowProviderLogin(true)
    setShowProviderRegister(false)
  }

  const handleNavigateToProviderRegister = () => {
    // Clear all user-related states first
    setShowRegister(false)
    setLoginMode('user')
    // Then set provider states
    setShowProviderRegister(true)
    setShowProviderLogin(false)
  }

  const handleNavigateToUserLogin = () => {
    // Clear all provider-related states first
    setShowProviderLogin(false)
    setShowProviderRegister(false)
    // Then set user states
    setShowRegister(false)
    setLoginMode('user')
  }

  const handleForgotPassword = () => {
    alert('Forgot password functionality will be implemented. Please contact support.')
  }

  const disconnectWallet = async () => {
    try {
      // Get wallet data to identify which wallet was connected
      const savedWallet = localStorage.getItem('walletData')
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet)
        const walletName = walletData.walletName || ''

        // Disconnect from Phantom wallet
        if ((walletName === 'Phantom' || !walletName) && window.solana && window.solana.isPhantom) {
          try {
            if (window.solana.isConnected) {
              await window.solana.disconnect()
            }
          } catch (error) {
            console.error('Error disconnecting Phantom wallet:', error)
          }
        }

        // Disconnect from Solflare wallet
        if (walletName === 'Solflare' && window.solflare) {
          try {
            if (window.solflare.isConnected) {
              await window.solflare.disconnect()
            }
          } catch (error) {
            console.error('Error disconnecting Solflare wallet:', error)
          }
        }

        // Disconnect from Backpack wallet
        if (walletName === 'Backpack' && window.backpack) {
          try {
            if (window.backpack.isConnected) {
              await window.backpack.disconnect()
            }
          } catch (error) {
            console.error('Error disconnecting Backpack wallet:', error)
          }
        }
      }

      // Clear wallet data from localStorage
      localStorage.removeItem('walletData')
    } catch (error) {
      console.error('Error during wallet disconnect:', error)
      // Still remove from localStorage even if disconnect fails
      localStorage.removeItem('walletData')
    }
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      // Disconnect wallet first
      await disconnectWallet()

      // Clear login status but keep appointments (optional)
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('loginMethod')
      localStorage.removeItem('userRole')
      // Optionally clear all data:
      // localStorage.clear()
      setIsLoggedIn(false)
      setShowRegister(false)
      setUserRole('user')
      setActiveView('My Appointments')
      setProviderActiveView('Dashboard')
    }
  }

  const renderProviderContent = () => {
    switch (providerActiveView) {
      case 'Dashboard':
        return <ProviderDashboard />
      case 'My Schedule':
        return <ProviderAppointments />
      case 'Active Sessions':
        return <ProviderActiveSession />
      case 'Earnings':
        return <ProviderEarnings />
      case 'Profile':
        return (
          <ProviderProfile
            onNavigateToAvailability={() => setProviderActiveView('Availability')}
            onNavigateToNotifications={() => setProviderActiveView('Notifications')}
            onNavigateToPaymentMethods={() => setProviderActiveView('Payment Methods')}
          />
        )
      case 'Availability':
        return <ProviderAvailability onBack={() => setProviderActiveView('Profile')} />
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

  // Show login/register page if not logged in
  if (!isLoggedIn) {
    // Show provider login/register (completely separate from user login)
    if (showProviderLogin || showProviderRegister) {
      return (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {!showProviderRegister && (
            <ProviderLogin
              onLogin={handleLogin}
              onNavigateToUserLogin={handleNavigateToUserLogin}
              onNavigateToRegister={handleNavigateToProviderRegister}
            />
          )}
          {showProviderRegister && (
            <div className="register-modal-overlay provider-register-overlay" onClick={handleNavigateToProviderLogin}>
              <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
                <Register
                  onRegister={handleRegister}
                  onNavigateToLogin={handleNavigateToProviderLogin}
                  role="provider"
                />
              </div>
            </div>
          )}
        </div>
      )
    }
    
    // Show user login/register (completely separate from provider login)
    return (
      <div style={{ position: 'relative', zIndex: 1 }}>
        {!showRegister && (
          <Login
            onLogin={handleLogin}
            onNavigateToRegister={handleNavigateToRegister}
            onForgotPassword={handleForgotPassword}
            loginMode={loginMode}
            onToggleMode={(mode) => setLoginMode(mode)}
            onNavigateToProviderLogin={handleNavigateToProviderLogin}
          />
        )}
        {showRegister && (
          <div className="register-modal-overlay user-register-overlay" onClick={handleNavigateToLogin}>
            <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
              <Register
                onRegister={handleRegister}
                onNavigateToLogin={handleNavigateToLogin}
                role="user"
              />
            </div>
          </div>
        )}
      </div>
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
    <div className="app">
      <Header 
        onNavigateToProfile={handleNavigateToProfile}
        onSignOut={handleSignOut}
        activeView={activeView}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
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
          hasBookedSession={hasBookedSession}
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
  )
}

export default App
