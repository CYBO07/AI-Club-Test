import { Router } from "express";
import { requireAuth, requireStudent, loadUser } from "../middleware/auth.js";
import { getAvailableTest, startAttempt, saveAnswer, submitAttempt, getMyAttempts } from "../controllers/attemptController.js";

const router = Router();
router.use(requireAuth, requireStudent, loadUser);

router.get("/history", getMyAttempts);
router.get("/available", getAvailableTest);
router.post("/start", startAttempt);
router.patch("/:id/answer", saveAnswer);
router.post("/:id/submit", submitAttempt);

export default router;
