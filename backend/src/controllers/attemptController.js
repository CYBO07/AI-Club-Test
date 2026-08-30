import mongoose from "mongoose";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import TestAttempt from "../models/TestAttempt.js";
import Result from "../models/Result.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Strips correctAnswer + explanation before sending to the student's browser
function toClientQuestion(q) {
  return {
    questionId: q._id,
    question: q.question,
    optionA: q.options.A,
    optionB: q.options.B,
    optionC: q.options.C,
    optionD: q.options.D,
    marks: q.marks,
  };
}

async function selectQuestionsForTest(test) {
  if (test.questionSelectionMode === "Manual") {
    const qs = await Question.find({ _id: { $in: test.manualQuestionIds }, status: "Active" });
    return shuffle(qs);
  }

  const diffCfg = test.difficultyConfiguration || {};
  const diffSum = (diffCfg.Easy || 0) + (diffCfg.Medium || 0) + (diffCfg.Hard || 0);

  if (diffSum === test.numberOfQuestions && diffSum > 0) {
    let selected = [];
    for (const diff of ["Easy", "Medium", "Hard"]) {
      const need = diffCfg[diff] || 0;
      if (need === 0) continue;
      const pool = await Question.aggregate([
        { $match: { year: test.year, status: "Active", difficulty: diff } },
        { $sample: { size: need } },
      ]);
      selected = selected.concat(pool);
    }
    return shuffle(selected);
  }

  // Pure random across the year, no difficulty split configured
  const pool = await Question.aggregate([
    { $match: { year: test.year, status: "Active" } },
    { $sample: { size: test.numberOfQuestions } },
  ]);
  return shuffle(pool);
}

// GET /api/attempts/history  -> this student's own attempts, across all tests (additive, read-only)
export const getMyAttempts = asyncHandler(async (req, res) => {
  const student = req.user;
  const attempts = await TestAttempt.find({ studentId: student._id })
    .populate("testId", "name year duration numberOfQuestions totalMarks status")
    .sort({ createdAt: -1 });

  const data = attempts
    .filter((a) => a.testId) // skip attempts whose test was deleted
    .map((a) => ({
      attemptId: a._id,
      test: {
        id: a.testId._id,
        name: a.testId.name,
        year: a.testId.year,
        duration: a.testId.duration,
        numberOfQuestions: a.testId.numberOfQuestions,
        totalMarks: a.testId.totalMarks,
      },
      status: a.status,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      score: a.score,
    }));

  res.json(data);
});

// GET /api/attempts/available  -> the single active test for this student's year (if any)
export const getAvailableTest = asyncHandler(async (req, res) => {
  const student = req.user;
  const test = await Test.findOne({ year: student.year, status: "Active" }).sort({ createdAt: -1 });
  if (!test) {
    return res.json({ test: null, message: "No questions have been added for this test yet. Please contact the administrator." });
  }

  const existingAttempt = await TestAttempt.findOne({ studentId: student._id, testId: test._id });

  res.json({
    test: {
      id: test._id,
      name: test.name,
      year: test.year,
      duration: test.duration,
      numberOfQuestions: test.numberOfQuestions,
      totalMarks: test.totalMarks,
      negativeMarking: test.negativeMarking,
    },
    attemptStatus: existingAttempt ? existingAttempt.status : null,
  });
});

// POST /api/attempts/start  { testId }
export const startAttempt = asyncHandler(async (req, res) => {
  const student = req.user;
  const { testId } = req.body;
  const test = await Test.findById(testId);
  if (!test) throw new ApiError(404, "Test not found");
  if (test.status !== "Active") throw new ApiError(400, "This test is not currently active.");
  if (test.year !== student.year) throw new ApiError(403, "This test is not available for your academic year.");

  // Idempotent: if an attempt already exists, return the SAME question set (no re-randomization on refresh)
  let attempt = await TestAttempt.findOne({ studentId: student._id, testId: test._id });

  if (attempt) {
    if (attempt.status !== "InProgress") {
      throw new ApiError(400, "You have already submitted this test.");
    }
    if (new Date() > attempt.expiresAt) {
      await autoSubmit(attempt, test);
      throw new ApiError(400, "Your test time has expired and has been auto-submitted.");
    }
    const questions = await Question.find({ _id: { $in: attempt.questionIds } });
    const byId = new Map(questions.map((q) => [String(q._id), q]));
    const orderedQuestions = attempt.questionIds.map((id) => byId.get(String(id))).filter(Boolean);
    return res.json({
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      questions: orderedQuestions.map(toClientQuestion),
      answers: attempt.answers.map((a) => ({ questionId: a.questionId, selectedOption: a.selectedOption })),
    });
  }

  const questions = await selectQuestionsForTest(test);
  if (questions.length < test.numberOfQuestions) {
    throw new ApiError(400, "Not enough active questions are currently available. Please contact the administrator.");
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + test.duration * 60 * 1000);

  try {
    attempt = await TestAttempt.create({
      studentId: student._id,
      testId: test._id,
      questionIds: questions.map((q) => q._id),
      answers: questions.map((q) => ({ questionId: q._id, selectedOption: null })),
      startedAt,
      expiresAt,
      status: "InProgress",
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(400, "You have already started this test.");
    throw err;
  }

  res.status(201).json({
    attemptId: attempt._id,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    questions: questions.map(toClientQuestion),
    answers: attempt.answers.map((a) => ({ questionId: a.questionId, selectedOption: a.selectedOption })),
  });
});

// PATCH /api/attempts/:id/answer  { questionId, selectedOption }
export const saveAnswer = asyncHandler(async (req, res) => {
  const student = req.user;
  const { questionId, selectedOption } = req.body;
  if (!["A", "B", "C", "D", null].includes(selectedOption)) throw new ApiError(400, "Invalid option");

  const attempt = await TestAttempt.findOne({ _id: req.params.id, studentId: student._id });
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.status !== "InProgress") throw new ApiError(400, "This test has already been submitted.");
  if (new Date() > attempt.expiresAt) throw new ApiError(400, "Time is up for this test.");

  const answer = attempt.answers.find((a) => String(a.questionId) === String(questionId));
  if (!answer) throw new ApiError(400, "This question is not part of your test.");
  answer.selectedOption = selectedOption;
  answer.answeredAt = new Date();
  await attempt.save();

  res.json({ message: "Answer saved" });
});

async function scoreAttempt(attempt, test) {
  const questions = await Question.find({ _id: { $in: attempt.questionIds } });
  const byId = new Map(questions.map((q) => [String(q._id), q]));

  let correct = 0, wrong = 0, unanswered = 0, score = 0;
  for (const ans of attempt.answers) {
    const q = byId.get(String(ans.questionId));
    if (!q) continue;
    if (!ans.selectedOption) {
      unanswered++;
      continue;
    }
    if (ans.selectedOption === q.correctAnswer) {
      correct++;
      score += q.marks;
    } else {
      wrong++;
      score -= test.negativeMarking || 0;
    }
  }
  score = Math.max(0, score);
  return { correct, wrong, unanswered, score };
}

async function autoSubmit(attempt, test) {
  const { correct, wrong, unanswered, score } = await scoreAttempt(attempt, test);
  attempt.status = "AutoSubmitted";
  attempt.submittedAt = attempt.expiresAt;
  attempt.score = score;
  await attempt.save();
  await persistResult(attempt, test, { correct, wrong, unanswered, score });
}

async function persistResult(attempt, test, { correct, wrong, unanswered, score }) {
  const timeTaken = Math.round((attempt.submittedAt - attempt.startedAt) / 1000);
  const percentage = test.totalMarks > 0 ? Math.round((score / test.totalMarks) * 10000) / 100 : 0;
  await Result.findOneAndUpdate(
    { studentId: attempt.studentId, testId: test._id },
    {
      studentId: attempt.studentId,
      testId: test._id,
      attemptId: attempt._id,
      correct,
      wrong,
      unanswered,
      score,
      totalMarks: test.totalMarks,
      percentage,
      timeTaken,
    },
    { upsert: true, new: true }
  );
}

// POST /api/attempts/:id/submit
export const submitAttempt = asyncHandler(async (req, res) => {
  const student = req.user;
  const attempt = await TestAttempt.findOne({ _id: req.params.id, studentId: student._id });
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.status !== "InProgress") throw new ApiError(400, "This test has already been submitted.");

  const test = await Test.findById(attempt.testId);
  const { correct, wrong, unanswered, score } = await scoreAttempt(attempt, test);

  attempt.status = "Submitted";
  attempt.submittedAt = new Date();
  attempt.score = score;
  await attempt.save();

  await persistResult(attempt, test, { correct, wrong, unanswered, score });

  res.json({
    message: "Test submitted successfully",
    summary: { correct, wrong, unanswered, score, totalMarks: test.totalMarks },
  });
});
