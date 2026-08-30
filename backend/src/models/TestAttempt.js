import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOption: { type: String, enum: ["A", "B", "C", "D", null], default: null },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }],
    answers: [answerSchema],
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: { type: String, enum: ["InProgress", "Submitted", "AutoSubmitted"], default: "InProgress" },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testAttemptSchema.index({ studentId: 1, testId: 1 }, { unique: true });

export default mongoose.model("TestAttempt", testAttemptSchema);
