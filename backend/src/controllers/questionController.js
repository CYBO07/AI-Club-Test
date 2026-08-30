import Question, { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from "../models/Question.js";
import { YEAR_OPTIONS } from "../models/Student.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { parse as parseCsv } from "csv-parse/sync";
import XLSX from "xlsx";

// GET /api/questions
export const listQuestions = asyncHandler(async (req, res) => {
  const { search = "", year = "", category = "", difficulty = "", status = "", page = 1, limit = 20 } = req.query;
  const filter = {};
  if (year) filter.year = year;
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (status) filter.status = status;
  if (search) filter.question = new RegExp(search, "i");

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

  const [data, total] = await Promise.all([
    Question.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Question.countDocuments(filter),
  ]);

  res.json({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// GET /api/questions/stats  -> counts by year/difficulty (only Active questions count toward tests)
export const questionStats = asyncHandler(async (req, res) => {
  const agg = await Question.aggregate([
    { $match: { status: "Active" } },
    { $group: { _id: { year: "$year", difficulty: "$difficulty" }, count: { $sum: 1 } } },
  ]);

  const stats = {};
  for (const year of YEAR_OPTIONS) {
    stats[year] = { Easy: 0, Medium: 0, Hard: 0, Total: 0 };
  }
  for (const row of agg) {
    const { year, difficulty } = row._id;
    if (!stats[year]) continue;
    stats[year][difficulty] = row.count;
    stats[year].Total += row.count;
  }
  res.json(stats);
});

// GET /api/questions/:id
export const getQuestion = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) throw new ApiError(404, "Question not found");
  res.json(q);
});

function validatePayload(body) {
  const { question, options, correctAnswer, year, category, difficulty, marks } = body;
  if (!question || !question.trim()) throw new ApiError(400, "Question text is required");
  if (!options || !options.A || !options.B || !options.C || !options.D) {
    throw new ApiError(400, "All four options (A, B, C, D) are required");
  }
  if (!["A", "B", "C", "D"].includes(correctAnswer)) throw new ApiError(400, "A valid correct answer (A/B/C/D) is required");
  if (!YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");
  if (!CATEGORY_OPTIONS.includes(category)) throw new ApiError(400, "Invalid category");
  if (!DIFFICULTY_OPTIONS.includes(difficulty)) throw new ApiError(400, "Invalid difficulty");
  if (!marks || Number(marks) < 1) throw new ApiError(400, "Marks must be at least 1");
}

// POST /api/questions
export const createQuestion = asyncHandler(async (req, res) => {
  validatePayload(req.body);
  const { question, options, correctAnswer, year, category, difficulty, marks, explanation, status } = req.body;
  const q = await Question.create({
    question,
    options,
    correctAnswer,
    year,
    category,
    difficulty,
    marks,
    explanation: explanation || "",
    status: status || "Active",
    createdBy: req.auth.id,
  });
  res.status(201).json(q);
});

// PUT /api/questions/:id
export const updateQuestion = asyncHandler(async (req, res) => {
  validatePayload(req.body);
  const { question, options, correctAnswer, year, category, difficulty, marks, explanation, status } = req.body;
  const q = await Question.findByIdAndUpdate(
    req.params.id,
    { question, options, correctAnswer, year, category, difficulty, marks, explanation, status },
    { new: true, runValidators: true }
  );
  if (!q) throw new ApiError(404, "Question not found");
  res.json(q);
});

// PATCH /api/questions/:id/status
export const setQuestionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Inactive"].includes(status)) throw new ApiError(400, "Invalid status");
  const q = await Question.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!q) throw new ApiError(404, "Question not found");
  res.json(q);
});

// DELETE /api/questions/:id
export const deleteQuestion = asyncHandler(async (req, res) => {
  const q = await Question.findByIdAndDelete(req.params.id);
  if (!q) throw new ApiError(404, "Question not found");
  res.json({ message: "Question deleted successfully" });
});

// GET /api/questions/import/template
export const downloadQuestionTemplate = asyncHandler(async (req, res) => {
  const header = "Question,Option A,Option B,Option C,Option D,Correct Answer,Year,Category,Difficulty,Marks,Explanation\n";
  const example =
    'What does CPU stand for?,Central Processing Unit,Central Program Unit,Computer Personal Unit,Central Processor Utility,A,BCA 1st Year,Computer Basics,Easy,1,"CPU is the primary component that executes instructions."\n';
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=question_import_template.csv");
  res.send(header + example);
});

function parseUploadedFile(file) {
  const name = file.originalname.toLowerCase();
  if (name.endsWith(".csv")) {
    return parseCsv(file.buffer.toString("utf-8"), { columns: true, skip_empty_lines: true, trim: true });
  }
  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

// POST /api/questions/import
export const importQuestions = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  let rows;
  try {
    rows = parseUploadedFile(req.file);
  } catch (err) {
    throw new ApiError(400, "Could not parse the uploaded file. Please use the provided template.");
  }

  const created = [];
  const failed = [];

  for (const [idx, row] of rows.entries()) {
    const rowNum = idx + 2;
    try {
      const payload = {
        question: row["Question"],
        options: {
          A: row["Option A"],
          B: row["Option B"],
          C: row["Option C"],
          D: row["Option D"],
        },
        correctAnswer: String(row["Correct Answer"] || "").trim().toUpperCase(),
        year: row["Year"],
        category: row["Category"],
        difficulty: row["Difficulty"],
        marks: Number(row["Marks"] || 1),
      };
      validatePayload(payload);
      const q = await Question.create({
        ...payload,
        explanation: row["Explanation"] || "",
        status: "Active",
        createdBy: req.auth.id,
      });
      created.push({ row: rowNum, id: q._id });
    } catch (err) {
      failed.push({ row: rowNum, error: err.message });
    }
  }

  res.status(201).json({ createdCount: created.length, failedCount: failed.length, created, failed });
});

// GET /api/questions/export  -> CSV of current filtered set
export const exportQuestions = asyncHandler(async (req, res) => {
  const { year = "", category = "", difficulty = "", status = "" } = req.query;
  const filter = {};
  if (year) filter.year = year;
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (status) filter.status = status;

  const questions = await Question.find(filter).sort({ createdAt: -1 });
  const header = "Question,Option A,Option B,Option C,Option D,Correct Answer,Year,Category,Difficulty,Marks,Explanation,Status\n";
  const esc = (v = "") => `"${String(v).replace(/"/g, '""')}"`;
  const rows = questions
    .map((q) =>
      [q.question, q.options.A, q.options.B, q.options.C, q.options.D, q.correctAnswer, q.year, q.category, q.difficulty, q.marks, q.explanation, q.status]
        .map(esc)
        .join(",")
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=question_bank_export.csv");
  res.send(header + rows);
});
