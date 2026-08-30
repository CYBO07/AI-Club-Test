import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import myResultsRoutes from "./routes/myResultsRoutes.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "2mb" }));

const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 50 });
app.use("/api/auth", authLimiter);

app.get("/api/health", (req,res)=> res.json({ status:"ok", message:"AI Club backend is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/my-results", myResultsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI).then(()=>{
  console.log("MongoDB Connected");
  app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
}).catch(err=>{
  console.error("DB Error:", err.message);
  process.exit(1);
});
