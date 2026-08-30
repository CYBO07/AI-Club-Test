import Admin from "../models/Admin.js";
import Student from "../models/Student.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/token.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

// POST /api/auth/admin/login
export const adminLogin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError(400, "Username/email and password are required");

  const admin = await Admin.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  });
  if (!admin) throw new ApiError(401, "Invalid credentials");

  const ok = await comparePassword(password, admin.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = signToken({ id: admin._id, role: "admin" });
  res.json({
    token,
    user: { id: admin._id, fullName: admin.fullName, email: admin.email, username: admin.username, role: "admin" },
  });
});

// POST /api/auth/student/login
export const studentLogin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError(400, "Username/email and password are required");

  const student = await Student.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  });
  if (!student) throw new ApiError(401, "Invalid credentials");

  if (student.status !== "Active") {
    throw new ApiError(403, "Your account has been disabled. Please contact the administrator.");
  }

  // Enforce configured login method
  const usedField = student.username === identifier ? "username" : "email";
  if (student.loginMethod !== "both" && student.loginMethod !== usedField) {
    throw new ApiError(401, "Invalid credentials");
  }

  const ok = await comparePassword(password, student.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = signToken({ id: student._id, role: "student" });
  res.json({
    token,
    user: {
      id: student._id,
      fullName: student.fullName,
      rollNumber: student.rollNumber,
      username: student.username,
      email: student.email,
      year: student.year,
      mustResetPassword: student.mustResetPassword,
      role: "student",
    },
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ role: req.auth.role, user: req.user });
});

// POST /api/auth/change-password (self-service, both roles)
export const changeOwnPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, "Both current and new password are required");
  if (newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters");

  const Model = req.auth.role === "admin" ? Admin : Student;
  const doc = await Model.findById(req.auth.id);
  const ok = await comparePassword(currentPassword, doc.passwordHash);
  if (!ok) throw new ApiError(401, "Current password is incorrect");

  doc.passwordHash = await hashPassword(newPassword);
  if (doc.mustResetPassword !== undefined) doc.mustResetPassword = false;
  await doc.save();
  res.json({ message: "Password updated successfully" });
});
