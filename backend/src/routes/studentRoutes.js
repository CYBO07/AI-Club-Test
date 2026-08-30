import { Router } from "express";
import multer from "multer";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  listStudents, getStudent, createStudent, updateStudent, setStudentStatus,
  resetStudentPassword, deleteStudent, downloadImportTemplate, importStudents,
  getStudentTestStatus, getStudentResult,
} from "../controllers/studentController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAuth, requireAdmin);

router.get("/import/template", downloadImportTemplate);
router.post("/import", upload.single("file"), importStudents);

router.get("/", listStudents);
router.post("/", createStudent);
router.get("/:id", getStudent);
router.put("/:id", updateStudent);
router.patch("/:id/status", setStudentStatus);
router.post("/:id/reset-password", resetStudentPassword);
router.delete("/:id", deleteStudent);
router.get("/:id/test-status", getStudentTestStatus);
router.get("/:id/result", getStudentResult);

export default router;
