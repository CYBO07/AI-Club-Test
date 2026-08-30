import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ role, children }) {
  const { user, role: currentRole, loading } = useAuth();
  if (loading) return null;
  if (!user || currentRole !== role) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/login"} replace />;
  }
  return children;
}
