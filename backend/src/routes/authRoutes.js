import { Router } from "express";
import { adminLogin, studentLogin, me, changeOwnPassword } from "../controllers/authController.js";
import { requireAuth, loadUser } from "../middleware/auth.js";

const router = Router();

router.post("/admin/login", adminLogin);
router.post("/student/login", studentLogin);
router.get("/me", requireAuth, loadUser, me);
router.post("/change-password", requireAuth, changeOwnPassword);

export default router;
