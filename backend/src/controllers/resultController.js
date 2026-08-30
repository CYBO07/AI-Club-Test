import Result from "../models/Result.js";
import Test from "../models/Test.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

// GET /api/my-results  (student, read-only) -> own results, each with rank among that test's participants
export const listMyResults = asyncHandler(async (req, res) => {
  const student = req.user;
  const own = await Result.find({ studentId: student._id })
    .populate("testId", "name year totalMarks")
    .sort({ createdAt: -1 });

  const data = [];
  for (const r of own) {
    const cohort = await Result.find({ testId: r.testId._id }).sort({ score: -1 });
    const rank = cohort.findIndex((c) => String(c._id) === String(r._id)) + 1;
    data.push({
      id: r._id,
      test: r.testId,
      correct: r.correct,
      wrong: r.wrong,
      unanswered: r.unanswered,
      score: r.score,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      timeTaken: r.timeTaken,
      rank,
      outOf: cohort.length,
      selectionStatus: r.selectionStatus,
      createdAt: r.createdAt,
    });
  }
  res.json(data);
});

// GET /api/results?testId=&year=&minPercentage=&selectionStatus=&sort=score
export const listResults = asyncHandler(async (req, res) => {
  const { testId = "", selectionStatus = "", minPercentage = "", sort = "-score" } = req.query;
  const filter = {};
  if (testId) filter.testId = testId;
  if (selectionStatus) filter.selectionStatus = selectionStatus;
  if (minPercentage) filter.percentage = { $gte: Number(minPercentage) };

  const results = await Result.find(filter)
    .populate("studentId", "fullName rollNumber email year username")
    .populate("testId", "name year totalMarks")
    .sort(sort === "-score" ? { score: -1 } : sort);

  // Rank within each test
  const byTest = new Map();
  for (const r of results) {
    const key = String(r.testId._id);
    if (!byTest.has(key)) byTest.set(key, []);
    byTest.get(key).push(r);
  }
  for (const list of byTest.values()) {
    list.sort((a, b) => b.score - a.score);
    list.forEach((r, i) => (r._rank = i + 1));
  }

  const data = results.map((r) => ({
    id: r._id,
    student: r.studentId,
    test: r.testId,
    correct: r.correct,
    wrong: r.wrong,
    unanswered: r.unanswered,
    score: r.score,
    totalMarks: r.totalMarks,
    percentage: r.percentage,
    timeTaken: r.timeTaken,
    selectionStatus: r.selectionStatus,
    rank: r._rank,
    createdAt: r.createdAt,
  }));

  res.json(data);
});

// PATCH /api/results/:id/selection  { selectionStatus }
export const setSelectionStatus = asyncHandler(async (req, res) => {
  const { selectionStatus } = req.body;
  if (!["Pending", "Shortlisted", "Selected", "Rejected"].includes(selectionStatus)) {
    throw new ApiError(400, "Invalid selection status");
  }
  const result = await Result.findByIdAndUpdate(req.params.id, { selectionStatus }, { new: true });
  if (!result) throw new ApiError(404, "Result not found");
  res.json(result);
});

// GET /api/results/export?testId=
export const exportResults = asyncHandler(async (req, res) => {
  const { testId = "" } = req.query;
  const filter = {};
  if (testId) filter.testId = testId;

  const results = await Result.find(filter)
    .populate("studentId", "fullName rollNumber email year username")
    .populate("testId", "name year totalMarks")
    .sort({ score: -1 });

  const header = "Name,Roll No,Username,Email,Year,Test,Correct,Wrong,Unanswered,Score,Total Marks,Percentage,Time Taken (s),Selection Status\n";
  const esc = (v = "") => `"${String(v).replace(/"/g, '""')}"`;
  const rows = results
    .map((r) =>
      [
        r.studentId?.fullName, r.studentId?.rollNumber, r.studentId?.username, r.studentId?.email, r.studentId?.year,
        r.testId?.name, r.correct, r.wrong, r.unanswered, r.score, r.totalMarks, r.percentage, r.timeTaken, r.selectionStatus,
      ].map(esc).join(",")
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=results_export.csv");
  res.send(header + rows);
});
