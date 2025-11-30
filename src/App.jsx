import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MemberAuthProvider } from './context/MemberAuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NotificationPopup from './components/NotificationPopup'
import InstallPrompt from './components/InstallPrompt'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import SplashScreen from './components/SplashScreen'
import NotificationService from './components/NotificationService'
import { isPWA } from './utils/isPWA'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Team from './pages/Team'
import Gallery from './pages/Gallery'
import Join from './pages/Join'
import About from './pages/About'
import Contact from './pages/Contact'
import DeveloperProfile from './pages/DeveloperProfile'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEvents from './pages/admin/AdminEvents'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminSettings from './pages/admin/AdminSettings'
import AdminTeam from './pages/admin/AdminTeam'
import AdminUsers from './pages/admin/AdminUsers'
import AdminEventRegistrations from './pages/admin/AdminEventRegistrations'
import AdminCheckIn from './pages/admin/AdminCheckIn'
import AdminFormTemplates from './pages/admin/AdminFormTemplates'
import MemberLogin from './pages/MemberLogin'
import EventRegister from './pages/EventRegister'
import MemberDashboard from './pages/member/MemberDashboard'
import MemberProfile from './pages/member/MemberProfile'
import MemberEvents from './pages/member/MemberEvents'
import MemberCertificates from './pages/member/MemberCertificates'
import MemberDirectory from './pages/MemberDirectory'
import MemberProfilePublic from './pages/MemberProfilePublic'
import VerifyEmail from './pages/VerifyEmail'
import VerifyDisplayEmail from './pages/VerifyDisplayEmail'

function App() {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Only show splash screen in PWA mode, not in browser
    if (!isPWA()) {
      setShowSplash(false)
      return
    }

    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('splash-shown')
    if (splashShown) {
      setShowSplash(false)
    } else {
      setShowSplash(true)
      sessionStorage.setItem('splash-shown', 'true')
    }
  }, [])

  const handleSplashFinish = () => {
    setShowSplash(false)
  }

  return (
    <AuthProvider>
      <MemberAuthProvider>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <div className="app" style={showSplash ? { opacity: 0, pointerEvents: 'none' } : {}}>
          <Navbar />
          <NotificationPopup />
          <InstallPrompt />
          <NotificationService />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:eventId" element={<EventDetail />} />
              <Route path="/events/:eventId/register" element={<EventRegister />} />
              <Route path="/team" element={<Team />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/join" element={<Join />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/developer" element={<DeveloperProfile />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute>
                    <AdminEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute>
                    <AdminNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/team"
                element={
                  <ProtectedRoute>
                    <AdminTeam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/registrations"
                element={
                  <ProtectedRoute>
                    <AdminEventRegistrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/checkin"
                element={
                  <ProtectedRoute>
                    <AdminCheckIn />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/form-templates"
                element={
                  <ProtectedRoute>
                    <AdminFormTemplates />
                  </ProtectedRoute>
                }
              />
              <Route path="/member/login" element={<MemberLogin />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-display-email" element={<VerifyDisplayEmail />} />
              <Route
                path="/member"
                element={<MemberDashboard />}
              />
              <Route
                path="/member/profile"
                element={<MemberProfile />}
              />
              <Route
                path="/member/events"
                element={<MemberEvents />}
              />
              <Route
                path="/member/certificates"
                element={<MemberCertificates />}
              />
              <Route path="/members" element={<MemberDirectory />} />
              <Route path="/members/:memberId" element={<MemberProfilePublic />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
      </MemberAuthProvider>
    </AuthProvider>
  )
}

export default App

