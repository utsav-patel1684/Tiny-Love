import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/UsersPage";
import BabiesPage from "./pages/admin/BabiesPage";
import MemoriesPage from "./pages/admin/MemoriesPage";
import InvitesPage from "./pages/admin/InvitesPage";
import DreamTalesPage from "./pages/admin/DreamTalesPage";
// 1. Import your brand new Login page here (adjust path if needed)
import { Login } from "./pages/admin/Login";

function App() {
  // 2. Track authentication status via localStorage token
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            !token ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            token ? (
              <AdminLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="babies" element={<BabiesPage />} />
          <Route path="memories" element={<MemoriesPage />} />
          <Route path="invites" element={<InvitesPage />} />
          <Route path="dream-tales" element={<DreamTalesPage />} />
        </Route>

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;