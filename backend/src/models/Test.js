import mongoose from "mongoose";
import { YEAR_OPTIONS } from "./Student.js";

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    year: { type: String, required: true, enum: YEAR_OPTIONS },
    duration: { type: Number, required: true, min: 1 },
    numberOfQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    negativeMarking: { type: Number, default: 0, min: 0 },
    questionSelectionMode: { type: String, enum: ["Random", "Manual"], default: "Random" },
    manualQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    difficultyConfiguration: {
      Easy: { type: Number, default: 0 },
      Medium: { type: Number, default: 0 },
      Hard: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["Draft", "Active", "Paused", "Closed"], default: "Draft" },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Test", testSchema);
