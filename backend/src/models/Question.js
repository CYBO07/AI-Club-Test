import mongoose from "mongoose";
import { YEAR_OPTIONS } from "./Student.js";

export const CATEGORY_OPTIONS = [
  "Computer Basics",
  "Logical Reasoning",
  "Problem Solving",
  "Programming",
  "DSA",
  "DBMS",
  "Web Development",
  "AI/ML",
  "Generative AI",
  "Cybersecurity",
  "Cloud/DevOps",
  "General Technology",
];

export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correctAnswer: { type: String, required: true, enum: ["A", "B", "C", "D"] },
    year: { type: String, required: true, enum: YEAR_OPTIONS },
    category: { type: String, required: true, enum: CATEGORY_OPTIONS },
    difficulty: { type: String, required: true, enum: DIFFICULTY_OPTIONS },
    marks: { type: Number, required: true, min: 1, default: 1 },
    explanation: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

questionSchema.index({ year: 1, category: 1, difficulty: 1, status: 1 });

export default mongoose.model("Question", questionSchema);
