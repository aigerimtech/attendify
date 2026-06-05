import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import FaceSetup from './pages/Auth/FaceSetup';
import Dashboard from './pages/Student/Dashboard';
import Profile from './pages/Student/Profile';
import QRScan from './pages/Student/QRScan';
import FaceVerify from './pages/Student/FaceVerify';
import Confirmation from './pages/Student/Confirmation';
import Schedule from './pages/Student/Schedule';
import Stats from './pages/Student/Stats';

export default function App() {
  return (
    <BrowserRouter>
      <div className="phone-frame">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/face-setup" element={<FaceSetup />} />
          <Route path="/student/dashboard" element={<Dashboard />} />
          <Route path="/student/profile" element={<Profile />} />
          <Route path="/student/scan" element={<QRScan />} />
          <Route path="/student/verify" element={<FaceVerify />} />
          <Route path="/student/confirmation" element={<Confirmation />} />
          <Route path="/student/schedule" element={<Schedule />} />
          <Route path="/student/stats" element={<Stats />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
