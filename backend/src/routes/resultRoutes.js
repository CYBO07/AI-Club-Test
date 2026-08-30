import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { listResults, setSelectionStatus, exportResults } from "../controllers/resultController.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", listResults);
router.get("/export", exportResults);
router.patch("/:id/selection", setSelectionStatus);

export default router;
