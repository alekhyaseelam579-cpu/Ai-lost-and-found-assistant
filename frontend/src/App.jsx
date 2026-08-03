import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportItem from './pages/ReportItem';
import Matches from './pages/Matches';
import ItemDetails from './pages/ItemDetails';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { token } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage || !token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onSearch={(q) => setSearchQuery(q)} />
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard searchQuery={searchQuery} /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><Dashboard searchQuery={searchQuery} /></ProtectedRoute>} />
            <Route path="/report-lost" element={<ProtectedRoute><ReportItem itemType="lost" /></ProtectedRoute>} />
            <Route path="/report-found" element={<ProtectedRoute><ReportItem itemType="found" /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
            <Route path="/items/:id" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
