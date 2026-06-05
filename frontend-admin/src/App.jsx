import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/AdminLayout.jsx'
import LoginPage from './pages/Auth/LoginPage.jsx'
import StudentsPage from './pages/Students/StudentsPage.jsx'
import CreateStudentPage from './pages/Students/CreateStudentPage.jsx'
import InstructorsPage from './pages/Instructors/InstructorsPage.jsx'
import CreateInstructorPage from './pages/Instructors/CreateInstructorPage.jsx'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/students" replace />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/create" element={<CreateStudentPage />} />
          <Route path="/instructors" element={<InstructorsPage />} />
          <Route path="/instructors/create" element={<CreateInstructorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/students" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
