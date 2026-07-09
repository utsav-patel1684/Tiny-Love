import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import BabiesPage from "./pages/BabiesPage";
import BabyDetailPage from "./pages/BabyDetailPage";
import MemoriesPage from "./pages/MemoriesPage";
import MemoryDetailPage from "./pages/MemoryDetailPage";
import InvitesPage from "./pages/InvitesPage";
import InviteDetailPage from "./pages/InviteDetailPage";
import DreamTalesPage from "./pages/DreamTalesPage";
import DreamTaleDetailPage from "./pages/DreamTaleDetailPage";
import ReactionsPage from "./pages/ReactionsPage";
import HighlightsPage from "./pages/HighlightsPage";
// 1. Import your brand new Login page here (adjust path if needed)
import { Login } from "./pages/Login";

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
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="babies" element={<BabiesPage />} />
          <Route path="babies/:id" element={<BabyDetailPage />} />
          <Route path="memories" element={<MemoriesPage />} />
          <Route path="memories/:id" element={<MemoryDetailPage />} />
          <Route path="invites" element={<InvitesPage />} />
          <Route path="invites/:id" element={<InviteDetailPage />} />
          <Route path="dream-tales" element={<DreamTalesPage />} />
          <Route path="dream-tales/:id" element={<DreamTaleDetailPage />} />
          <Route path="reactions" element={<ReactionsPage />} />
          <Route path="highlights" element={<HighlightsPage />} />
        </Route>

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;