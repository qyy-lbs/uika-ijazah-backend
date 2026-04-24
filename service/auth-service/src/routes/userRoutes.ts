import { Router } from 'express';
import { createUser } from '../controllers/userController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

// Hanya akun dengan role 'admin' yang bisa mengakses rute ini
router.post('/create', authorizeRoles('admin'), createUser);

export default router;