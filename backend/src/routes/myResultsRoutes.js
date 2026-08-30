// Additive, student-facing, read-only route. Does not alter the existing
// admin-only /api/results contract in resultRoutes.js.
import { Router } from "express";
import { requireAuth, requireStudent, loadUser } from "../middleware/auth.js";
import { listMyResults } from "../controllers/resultController.js";

const router = Router();
router.get("/", requireAuth, requireStudent, loadUser, listMyResults);

export default router;
