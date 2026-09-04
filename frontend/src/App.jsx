import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';

import Login from './pages/Login';
import Home from './pages/Home';
import BookSlot from './pages/BookSlot';
import MyToken from './pages/MyToken';

const ProtectedRoute = ({ children }) => {
  const token = useStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden relative">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/book/:scheduleId" element={<ProtectedRoute><BookSlot /></ProtectedRoute>} />
          <Route path="/token/:bookingId" element={<ProtectedRoute><MyToken /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
