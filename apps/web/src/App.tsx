import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoleUser } from '@si-aparat/shared';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Lapor } from './pages/Lapor';
import { Tracking } from './pages/Tracking';
import { Login } from './pages/Login';
import { DashboardMPK } from './pages/DashboardMPK';
import { DashboardPembina } from './pages/DashboardPembina';
import { DashboardAdmin } from './pages/DashboardAdmin';

export const App: React.FC = () => {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/lapor" element={<Lapor />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard/mpk"
              element={
                <ProtectedRoute allowedRoles={[RoleUser.MPK]}>
                  <DashboardMPK />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/pembina"
              element={
                <ProtectedRoute allowedRoles={[RoleUser.PEMBINA]}>
                  <DashboardPembina />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={[RoleUser.SUPER_ADMIN]}>
                  <DashboardAdmin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
