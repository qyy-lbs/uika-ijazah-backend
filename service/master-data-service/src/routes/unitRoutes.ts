import { Router } from "express";

import { upload } from '../middlewares/upload.middleware.js'; // Tambahkan ini
import {
  createUnit,
  editUnit,
  deleteUnits,
  restoreUnit,
  deleteProdi,
  restoreProdi,
  getAllUnits,
  createProdi,
  getProdiByUnit,
  editProdi,
} from "../controllers/unitController.js";
import { verifyToken, authorizeRoles } from "../middlewares/masterMiddleware.js";

const router = Router();

// Semua route unit dilindungi oleh token
router.use(verifyToken);

// Hanya Admin yang bisa menambah unit
router.post("/createUnit", upload, authorizeRoles("admin"), createUnit);

// Semua role (Rektor/Dekan) bisa melihat daftar unit
router.get("/getAllUnit", getAllUnits);
// Hanya Admin yang bisa mengahapus unit
router.delete("/deleteUnit/:id", authorizeRoles("admin"), deleteUnits);
router.patch("/restoreUnit/:id", authorizeRoles("admin"), restoreUnit);

// Hanya Admin yang bisa mengubah unit
router.put("/editUnit/:id",upload, authorizeRoles("admin"), editUnit);

router.post("/createProdi",upload, authorizeRoles("admin"), createProdi);
router.get("/:id_unit/prodi", getProdiByUnit);
router.put("/editProdi/:id",upload, authorizeRoles("admin"), editProdi);
router.delete("/deleteProdi/:id", authorizeRoles("admin"), deleteProdi);
router.patch("/restoreProdi/:id", authorizeRoles("admin"), restoreProdi);
export default router;
