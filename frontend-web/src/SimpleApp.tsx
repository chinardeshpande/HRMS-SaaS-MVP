import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SimpleLogin from './pages/SimpleLogin';
import SimpleDashboard from './pages/SimpleDashboard';

function SimpleApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<SimpleLogin />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<SimpleDashboard />} />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default SimpleApp;
