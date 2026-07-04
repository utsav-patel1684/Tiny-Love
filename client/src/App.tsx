import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/UsersPage";
import BabiesPage from "./pages/admin/BabiesPage";
import MemoriesPage from "./pages/admin/MemoriesPage";
import InvitesPage from "./pages/admin/InvitesPage";
import DreamTalesPage from "./pages/admin/DreamTalesPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="babies" element={<BabiesPage />} />
          <Route path="memories" element={<MemoriesPage />} />
          <Route path="invites" element={<InvitesPage />} />
          <Route path="dream-tales" element={<DreamTalesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
