import { Routes, Route } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/DashboardPage";
import Applications from "./pages/ApplicationsPage";
import PaymentPage from "./pages/PaymentPage";
import AdminApplicationsPage from "./pages/AdminApplicationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/applications" element={<Applications />} />
      <Route path="/admin/applications" element={<AdminApplicationsPage />} />
      <Route path="/payment/:id" element={<PaymentPage />} />
    </Routes>
  );
}