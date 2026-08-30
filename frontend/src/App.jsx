import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import Students from "./pages/admin/Students.jsx";
import Questions from "./pages/admin/Questions.jsx";
import Tests from "./pages/admin/Tests.jsx";
import TestBuilder from "./pages/admin/TestBuilder.jsx";
import Results from "./pages/admin/Results.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import Categories from "./pages/admin/Categories.jsx";
import Settings from "./pages/admin/Settings.jsx";

import StudentLayout from "./pages/student/StudentLayout.jsx";
import StudentDashboard from "./pages/student/Dashboard.jsx";
import AvailableTests from "./pages/student/AvailableTests.jsx";
import MyTests from "./pages/student/MyTests.jsx";
import MyResults from "./pages/student/MyResults.jsx";
import Profile from "./pages/student/Profile.jsx";
import TestRunner from "./pages/student/TestRunner.jsx";
import StudentResult from "./pages/student/Result.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login variant="student" />} />
      <Route path="/admin/login" element={<Login variant="admin" />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="questions" element={<Questions />} />
        <Route path="tests" element={<Tests />} />
        <Route path="results" element={<Results />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="categories" element={<Categories />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Full-page test builder (outside the sidebar shell, but still admin-protected) */}
      <Route
        path="/admin/tests/new"
        element={
          <ProtectedRoute role="admin">
            <div className="min-h-screen bg-surface p-4 sm:p-8"><TestBuilder /></div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests/:id/edit"
        element={
          <ProtectedRoute role="admin">
            <div className="min-h-screen bg-surface p-4 sm:p-8"><TestBuilder /></div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="available-tests" element={<AvailableTests />} />
        <Route path="my-tests" element={<MyTests />} />
        <Route path="my-results" element={<MyResults />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/test"
        element={
          <ProtectedRoute role="student">
            <TestRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/result"
        element={
          <ProtectedRoute role="student">
            <StudentResult />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
