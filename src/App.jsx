import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Schedule from './pages/Schedule'
import Dashboard from './pages/Dashboard'
import LiveSession from './pages/LiveSession'
import Reports from './pages/Reports'
import Courses from './pages/Courses'
import Sessions from './pages/Sessions'
import Settings from './pages/Settings'

/* ── Protect routes ─────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/* ── Inner router (needs AuthContext) ───────────────────────────── */
function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected */}
      <Route
        path="/"
        element={<RequireAuth><Layout /></RequireAuth>}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"    element={<Dashboard />}    />
        <Route path="courses"      element={<Courses />}      />
        <Route path="sessions"     element={<Sessions />}     />
        <Route path="schedule"     element={<Schedule />}     />
        <Route path="sessions/live" element={<LiveSession />} />
        <Route path="reports"      element={<Reports />}      />
        <Route path="settings"     element={<Settings />}     />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
