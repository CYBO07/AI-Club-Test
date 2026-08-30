import { Router } from "express";
import multer from "multer";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  listQuestions, questionStats, getQuestion, createQuestion, updateQuestion,
  setQuestionStatus, deleteQuestion, downloadQuestionTemplate, importQuestions, exportQuestions,
} from "../controllers/questionController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAuth, requireAdmin);

router.get("/stats", questionStats);
router.get("/import/template", downloadQuestionTemplate);
router.post("/import", upload.single("file"), importQuestions);
router.get("/export", exportQuestions);

router.get("/", listQuestions);
router.post("/", createQuestion);
router.get("/:id", getQuestion);
router.put("/:id", updateQuestion);
router.patch("/:id/status", setQuestionStatus);
router.delete("/:id", deleteQuestion);

export default router;
