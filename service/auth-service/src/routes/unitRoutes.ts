import { Router } from 'express';
import { createUnit, getAllUnits } from '../controllers/unitController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// Semua route unit dilindungi oleh token
router.use(verifyToken);

// Hanya Admin yang bisa menambah unit
router.post('/createUnit', authorizeRoles('admin'), createUnit);

// Semua role (Rektor/Dekan) bisa melihat daftar unit
router.get('/getAllUnit', getAllUnits);

export default router;