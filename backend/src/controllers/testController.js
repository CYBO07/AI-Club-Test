import Test from "../models/Test.js";
import Question from "../models/Question.js";
import { YEAR_OPTIONS } from "../models/Student.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

// GET /api/tests
export const listTests = asyncHandler(async (req, res) => {
  const { year = "", status = "" } = req.query;
  const filter = {};
  if (year) filter.year = year;
  if (status) filter.status = status;
  const tests = await Test.find(filter).sort({ createdAt: -1 });
  res.json(tests);
});

// GET /api/tests/:id
export const getTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  res.json(test);
});

function validateBasics(body) {
  const { name, year, duration, numberOfQuestions, totalMarks } = body;
  if (!name || !name.trim()) throw new ApiError(400, "Test name is required");
  if (!YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");
  if (!duration || Number(duration) <= 0) throw new ApiError(400, "Test duration must be greater than zero");
  if (!numberOfQuestions || Number(numberOfQuestions) < 1) throw new ApiError(400, "Number of questions must be at least 1");
  if (!totalMarks || Number(totalMarks) < 1) throw new ApiError(400, "Total marks must be at least 1");
}

// POST /api/tests  (created as Draft)
export const createTest = asyncHandler(async (req, res) => {
  validateBasics(req.body);
  const {
    name, year, duration, numberOfQuestions, totalMarks, negativeMarking,
    questionSelectionMode, manualQuestionIds, difficultyConfiguration, startDate, endDate,
  } = req.body;

  if (questionSelectionMode === "Manual") {
    if (!manualQuestionIds || manualQuestionIds.length !== Number(numberOfQuestions)) {
      throw new ApiError(400, `Manual selection requires exactly ${numberOfQuestions} question IDs`);
    }
  }

  if (difficultyConfiguration) {
    const sum = (difficultyConfiguration.Easy || 0) + (difficultyConfiguration.Medium || 0) + (difficultyConfiguration.Hard || 0);
    if (sum > 0 && sum !== Number(numberOfQuestions)) {
      throw new ApiError(400, `Difficulty configuration (${sum}) must add up to the number of questions (${numberOfQuestions})`);
    }
  }

  const test = await Test.create({
    name,
    year,
    duration,
    numberOfQuestions,
    totalMarks,
    negativeMarking: negativeMarking || 0,
    questionSelectionMode: questionSelectionMode || "Random",
    manualQuestionIds: manualQuestionIds || [],
    difficultyConfiguration: difficultyConfiguration || { Easy: 0, Medium: 0, Hard: 0 },
    status: "Draft",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    createdBy: req.auth.id,
  });
  res.status(201).json(test);
});

// PUT /api/tests/:id  (only editable while Draft or Paused)
export const updateTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  if (test.status === "Active" || test.status === "Closed") {
    throw new ApiError(400, `Cannot edit a test that is ${test.status}. Pause or close it first.`);
  }
  validateBasics(req.body);
  Object.assign(test, req.body, { status: test.status });
  await test.save();
  res.json(test);
});

// Core validation used before activation
async function validateForActivation(test) {
  const errors = [];

  if (!test.duration || test.duration <= 0) {
    errors.push("Test duration must be greater than zero.");
  }

  const questionFilter = { year: test.year, status: "Active" };
  const activeCount = await Question.countDocuments(questionFilter);

  if (activeCount < test.numberOfQuestions) {
    errors.push(
      `Cannot activate test. Only ${activeCount} active question${activeCount === 1 ? "" : "s"} available for ${test.year}, but this test requires ${test.numberOfQuestions} questions.`
    );
  }

  // Check every active question in this year has a valid correct answer (defensive, schema already enforces)
  const invalidAnswerCount = await Question.countDocuments({
    ...questionFilter,
    correctAnswer: { $nin: ["A", "B", "C", "D"] },
  });
  if (invalidAnswerCount > 0) {
    errors.push(`${invalidAnswerCount} question(s) for ${test.year} do not have a valid correct answer.`);
  }

  if (test.questionSelectionMode === "Manual") {
    if (test.manualQuestionIds.length !== test.numberOfQuestions) {
      errors.push(`Manually selected questions (${test.manualQuestionIds.length}) do not match the configured number of questions (${test.numberOfQuestions}).`);
    } else {
      const manualQs = await Question.find({ _id: { $in: test.manualQuestionIds } });
      const wrongYear = manualQs.filter((q) => q.year !== test.year);
      const inactive = manualQs.filter((q) => q.status !== "Active");
      if (wrongYear.length) errors.push(`${wrongYear.length} manually selected question(s) do not belong to ${test.year}.`);
      if (inactive.length) errors.push(`${inactive.length} manually selected question(s) are inactive.`);
      if (manualQs.length !== test.manualQuestionIds.length) errors.push("Some manually selected questions no longer exist.");
    }
  }

  const diffSum = (test.difficultyConfiguration?.Easy || 0) + (test.difficultyConfiguration?.Medium || 0) + (test.difficultyConfiguration?.Hard || 0);
  if (diffSum > 0) {
    if (diffSum !== test.numberOfQuestions) {
      errors.push(`Difficulty configuration (${diffSum}) does not match the number of questions (${test.numberOfQuestions}).`);
    } else if (test.questionSelectionMode === "Random") {
      for (const diff of ["Easy", "Medium", "Hard"]) {
        const need = test.difficultyConfiguration[diff] || 0;
        if (need === 0) continue;
        const have = await Question.countDocuments({ ...questionFilter, difficulty: diff });
        if (have < need) {
          errors.push(`Cannot activate test. Only ${have} active ${diff} question(s) available for ${test.year}, but this test requires ${need}.`);
        }
      }
    }
  }

  return errors;
}

// GET /api/tests/:id/validate  -> pre-check without activating
export const validateTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  const errors = await validateForActivation(test);
  res.json({ valid: errors.length === 0, errors });
});

// PATCH /api/tests/:id/status  { status: Draft|Active|Paused|Closed }
export const setTestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Draft", "Active", "Paused", "Closed"].includes(status)) throw new ApiError(400, "Invalid status");

  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");

  if (status === "Active") {
    const errors = await validateForActivation(test);
    if (errors.length) {
      throw new ApiError(400, errors[0]);
    }
  }

  test.status = status;
  await test.save();
  res.json(test);
});

// DELETE /api/tests/:id  (only Draft tests can be deleted)
export const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  if (test.status !== "Draft") throw new ApiError(400, "Only draft tests can be deleted. Close the test instead.");
  await test.deleteOne();
  res.json({ message: "Test deleted successfully" });
});
