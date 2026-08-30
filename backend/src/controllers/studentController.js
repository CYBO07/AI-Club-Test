import Student, { YEAR_OPTIONS } from "../models/Student.js";
import TestAttempt from "../models/TestAttempt.js";
import Result from "../models/Result.js";
import Test from "../models/Test.js";
import { hashPassword, generateTempPassword } from "../utils/password.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { parse as parseCsv } from "csv-parse/sync";
import XLSX from "xlsx";

function sanitizeStudent(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.passwordHash;
  return obj;
}

// GET /api/students
export const listStudents = asyncHandler(async (req, res) => {
  const { search = "", year = "", status = "", testStatus = "", page = 1, limit = 20 } = req.query;

  const filter = {};
  if (year) filter.year = year;
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ fullName: re }, { rollNumber: re }, { email: re }, { username: re }];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

  let students = await Student.find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const total = await Student.countDocuments(filter);

  // Attach test status (per student, across all tests they're eligible for)
  const studentIds = students.map((s) => s._id);
  const attempts = await TestAttempt.find({ studentId: { $in: studentIds } });
  const attemptByStudent = new Map();
  for (const a of attempts) attemptByStudent.set(String(a.studentId), a.status);

  let data = students.map((s) => {
    const obj = sanitizeStudent(s);
    const attemptStatus = attemptByStudent.get(String(s._id));
    obj.testStatus = attemptStatus === "InProgress" ? "In Progress" : attemptStatus === "Submitted" || attemptStatus === "AutoSubmitted" ? "Completed" : "Not Attempted";
    return obj;
  });

  if (testStatus) {
    data = data.filter((s) => s.testStatus === testStatus);
  }

  res.json({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// GET /api/students/:id
export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, "Student not found");
  res.json(sanitizeStudent(student));
});

// GET /api/students/:id/test-status
export const getStudentTestStatus = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, "Student not found");
  const tests = await Test.find({ year: student.year });
  const attempts = await TestAttempt.find({ studentId: student._id });
  const attemptByTest = new Map(attempts.map((a) => [String(a.testId), a]));
  const data = tests.map((t) => ({
    testId: t._id,
    testName: t.name,
    testStatus: t.status,
    attempt: attemptByTest.get(String(t._id))
      ? {
          status: attemptByTest.get(String(t._id)).status,
          startedAt: attemptByTest.get(String(t._id)).startedAt,
          submittedAt: attemptByTest.get(String(t._id)).submittedAt,
        }
      : null,
  }));
  res.json(data);
});

// GET /api/students/:id/result
export const getStudentResult = asyncHandler(async (req, res) => {
  const results = await Result.find({ studentId: req.params.id }).populate("testId", "name year totalMarks");
  res.json(results);
});

async function assertUnique({ email, username, rollNumber }, excludeId = null) {
  const orConditions = [];
  if (email) orConditions.push({ email: email.toLowerCase() });
  if (username) orConditions.push({ username });
  if (rollNumber) orConditions.push({ rollNumber });
  if (!orConditions.length) return;
  const query = { $or: orConditions };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Student.findOne(query);
  if (existing) {
    if (email && existing.email === email.toLowerCase()) throw new ApiError(409, "A student with this email already exists");
    if (username && existing.username === username) throw new ApiError(409, "A student with this username already exists");
    if (rollNumber && existing.rollNumber === rollNumber) throw new ApiError(409, "A student with this roll number already exists");
  }
}

// POST /api/students
export const createStudent = asyncHandler(async (req, res) => {
  const { fullName, rollNumber, email, username, password, year, phone, status, loginMethod, generatePassword } = req.body;

  if (!fullName || !rollNumber || !email || !username || !year) {
    throw new ApiError(400, "Full name, roll number, email, username and year are required");
  }
  if (!YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");

  await assertUnique({ email, username, rollNumber });

  const plainPassword = generatePassword ? generateTempPassword() : password;
  if (!plainPassword || plainPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters, or use Generate Password");
  }

  const student = await Student.create({
    fullName,
    rollNumber,
    email: email.toLowerCase(),
    username,
    passwordHash: await hashPassword(plainPassword),
    year,
    phone: phone || "",
    status: status || "Active",
    loginMethod: loginMethod || "both",
    mustResetPassword: !!generatePassword,
  });

  const responseBody = sanitizeStudent(student);
  // Password is returned exactly once, only in this creation response
  responseBody.temporaryPassword = plainPassword;
  res.status(201).json(responseBody);
});

// PUT /api/students/:id
export const updateStudent = asyncHandler(async (req, res) => {
  const { fullName, rollNumber, email, username, year, phone, status, loginMethod } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, "Student not found");

  if (year && !YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");
  await assertUnique({ email, username, rollNumber }, student._id);

  if (fullName !== undefined) student.fullName = fullName;
  if (rollNumber !== undefined) student.rollNumber = rollNumber;
  if (email !== undefined) student.email = email.toLowerCase();
  if (username !== undefined) student.username = username;
  if (year !== undefined) student.year = year;
  if (phone !== undefined) student.phone = phone;
  if (status !== undefined) student.status = status;
  if (loginMethod !== undefined) student.loginMethod = loginMethod;

  await student.save();
  res.json(sanitizeStudent(student));
});

// PATCH /api/students/:id/status  { status: "Active" | "Disabled" }
export const setStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Disabled"].includes(status)) throw new ApiError(400, "Invalid status");
  const student = await Student.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!student) throw new ApiError(404, "Student not found");
  res.json(sanitizeStudent(student));
});

// POST /api/students/:id/reset-password  { password? , generatePassword? }
export const resetStudentPassword = asyncHandler(async (req, res) => {
  const { password, generatePassword } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, "Student not found");

  const plainPassword = generatePassword ? generateTempPassword() : password;
  if (!plainPassword || plainPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters, or use Generate Password");
  }

  student.passwordHash = await hashPassword(plainPassword);
  student.mustResetPassword = !!generatePassword;
  await student.save();

  res.json({ message: "Password reset successfully", temporaryPassword: plainPassword });
});

// DELETE /api/students/:id
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, "Student not found");
  await TestAttempt.deleteMany({ studentId: student._id });
  await Result.deleteMany({ studentId: student._id });
  res.json({ message: "Student deleted successfully" });
});

// GET /api/students/import/template  -> downloadable CSV
export const downloadImportTemplate = asyncHandler(async (req, res) => {
  const header = "Full Name,Roll Number,Email,Username,Year\n";
  const example = "Rahul Kumar,BCA001,rahul@example.com,rahul001,BCA 1st Year\n";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=student_import_template.csv");
  res.send(header + example);
});

function parseUploadedFile(file) {
  const name = file.originalname.toLowerCase();
  if (name.endsWith(".csv")) {
    const text = file.buffer.toString("utf-8");
    return parseCsv(text, { columns: true, skip_empty_lines: true, trim: true });
  }
  // xlsx / xls
  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

// POST /api/students/import  (multipart file + passwordMode: "manual" | "generate", password?)
export const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const { passwordMode = "generate", password } = req.body;

  let rows;
  try {
    rows = parseUploadedFile(req.file);
  } catch (err) {
    throw new ApiError(400, "Could not parse the uploaded file. Please use the provided template.");
  }

  const created = [];
  const failed = [];

  for (const [idx, row] of rows.entries()) {
    const fullName = row["Full Name"] || row.fullName;
    const rollNumber = row["Roll Number"] || row.rollNumber;
    const email = row["Email"] || row.email;
    const username = row["Username"] || row.username;
    const year = row["Year"] || row.year;
    const rowNum = idx + 2; // account for header row

    try {
      if (!fullName || !rollNumber || !email || !username || !year) {
        throw new Error("Missing required field(s)");
      }
      if (!YEAR_OPTIONS.includes(year)) throw new Error(`Invalid year "${year}"`);
      await assertUnique({ email, username, rollNumber });

      const plainPassword = passwordMode === "manual" ? password : generateTempPassword();
      if (!plainPassword || plainPassword.length < 8) throw new Error("Password must be at least 8 characters");

      const student = await Student.create({
        fullName,
        rollNumber,
        email: String(email).toLowerCase(),
        username,
        passwordHash: await hashPassword(plainPassword),
        year,
        status: "Active",
        loginMethod: "both",
        mustResetPassword: passwordMode !== "manual",
      });

      created.push({
        row: rowNum,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        username: student.username,
        email: student.email,
        year: student.year,
        temporaryPassword: passwordMode === "manual" ? undefined : plainPassword,
      });
    } catch (err) {
      failed.push({ row: rowNum, fullName, rollNumber, error: err.message });
    }
  }

  res.status(201).json({
    createdCount: created.length,
    failedCount: failed.length,
    created,
    failed,
  });
});
