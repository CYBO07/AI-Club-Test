import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "TestAttempt", required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    unanswered: { type: Number, required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeTaken: { type: Number, required: true },
    selectionStatus: {
      type: String,
      enum: ["Pending", "Shortlisted", "Selected", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

resultSchema.index({ studentId: 1, testId: 1 }, { unique: true });

export default mongoose.model("Result", resultSchema);
