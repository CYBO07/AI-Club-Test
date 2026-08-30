import mongoose from "mongoose";

export const YEAR_OPTIONS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    year: { type: String, required: true, enum: YEAR_OPTIONS },
    phone: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Active", "Disabled"], default: "Active" },
    loginMethod: { type: String, enum: ["username", "email", "both"], default: "both" },
    mustResetPassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studentSchema.index({ fullName: "text", rollNumber: "text", email: "text", username: "text" });

export default mongoose.model("Student", studentSchema);
