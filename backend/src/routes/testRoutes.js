import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { listTests, getTest, createTest, updateTest, validateTest, setTestStatus, deleteTest } from "../controllers/testController.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", listTests);
router.post("/", createTest);
router.get("/:id", getTest);
router.put("/:id", updateTest);
router.get("/:id/validate", validateTest);
router.patch("/:id/status", setTestStatus);
router.delete("/:id", deleteTest);

export default router;
