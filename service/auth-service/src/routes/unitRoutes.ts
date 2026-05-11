import { Router } from 'express';
import { createUnit, editUnit, deleteUnits, getAllUnits, createProdi, getProdiByUnit } from '../controllers/unitController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { create } from 'node:domain';

const router = Router();

// Semua route unit dilindungi oleh token
router.use(verifyToken);

// Hanya Admin yang bisa menambah unit
router.post('/createUnit', authorizeRoles('admin'), createUnit);

// Semua role (Rektor/Dekan) bisa melihat daftar unit
router.get('/getAllUnit', getAllUnits);
// Hanya Admin yang bisa mengahapus unit
router.delete('/deleteUnit/:id', authorizeRoles('admin'), deleteUnits);

// Hanya Admin yang bisa mengubah unit
router.put('/editUnit/:id', authorizeRoles('admin'), editUnit);

router.post('/createProdi', authorizeRoles('admin'), createProdi);
router.get('/:id_unit/prodi', getProdiByUnit);
export default router;