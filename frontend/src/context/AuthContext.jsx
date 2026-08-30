import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");
    if (stored && storedRole) {
      setUser(JSON.parse(stored));
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  async function loginAdmin(identifier, password) {
    const data = await api.post("/auth/admin/login", { identifier, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("role", "admin");
    setUser(data.user);
    setRole("admin");
    return data.user;
  }

  async function loginStudent(identifier, password) {
    const data = await api.post("/auth/student/login", { identifier, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("role", "student");
    setUser(data.user);
    setRole("student");
    return data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, loginAdmin, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
