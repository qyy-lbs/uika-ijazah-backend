import { Router } from "express";
import {
  createUnit,
  editUnit,
  deleteUnits,
  getAllUnits,
  createProdi,
  getProdiByUnit,
  editProdi,
} from "../controllers/unitController.js";
import { verifyToken, authorizeRoles } from "../middlewares/masterMiddleware.js";
import { create } from "node:domain";

const router = Router();

// Semua route unit dilindungi oleh token
router.use(verifyToken);

// Hanya Admin yang bisa menambah unit
router.post("/createUnit", authorizeRoles("admin"), createUnit);

// Semua role (Rektor/Dekan) bisa melihat daftar unit
router.get("/getAllUnit", getAllUnits);
// Hanya Admin yang bisa mengahapus unit
router.delete("/deleteUnit/:id", authorizeRoles("admin"), deleteUnits);

// Hanya Admin yang bisa mengubah unit
router.put("/editUnit/:id", authorizeRoles("admin"), editUnit);

router.post("/createProdi", authorizeRoles("admin"), createProdi);
router.get("/:id_unit/prodi", getProdiByUnit);
router.put("/editProdi/:id", authorizeRoles("admin"), editProdi);
export default router;
