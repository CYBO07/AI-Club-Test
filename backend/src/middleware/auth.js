import { verifyToken } from "../utils/token.js";
import { ApiError } from "../utils/apiError.js";
import Admin from "../models/Admin.js";
import Student from "../models/Student.js";

// Verifies JWT and attaches { id, role } to req.auth
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new ApiError(401, "Authentication required");
    const decoded = verifyToken(token);
    req.auth = decoded; // { id, role }
    next();
  } catch (err) {
    next(new ApiError(401, "Invalid or expired session. Please log in again."));
  }
}

export function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }
  next();
}

export function requireStudent(req, res, next) {
  if (!req.auth || req.auth.role !== "student") {
    return next(new ApiError(403, "Student access required"));
  }
  next();
}

// Loads the full admin/student doc onto req.user, and blocks disabled students
export async function loadUser(req, res, next) {
  try {
    if (req.auth.role === "admin") {
      const admin = await Admin.findById(req.auth.id);
      if (!admin) return next(new ApiError(401, "Admin account not found"));
      req.user = admin;
    } else if (req.auth.role === "student") {
      const student = await Student.findById(req.auth.id);
      if (!student) return next(new ApiError(401, "Student account not found"));
      if (student.status !== "Active") {
        return next(new ApiError(403, "Your account has been disabled. Contact the administrator."));
      }
      req.user = student;
    }
    next();
  } catch (err) {
    next(err);
  }
}
