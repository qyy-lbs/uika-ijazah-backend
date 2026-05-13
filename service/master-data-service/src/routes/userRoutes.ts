import { Router } from 'express';
import { createUser, getAllUsers, deleteUser, editUser } from '../controllers/userController.js';
import { verifyToken, authorizeRoles } from '../middlewares/masterMiddleware.js';

const router = Router();

// Proteksi: Semua harus Login & harus role ADMIN [cite: 101, 150]
router.use(verifyToken);
router.use(authorizeRoles('admin'));

router.post('/', createUser);      // POST /api/users
router.get('/', getAllUsers);      // GET /api/users (Untuk tabel Figma)
router.delete('/:id', deleteUser); // DELETE /api/users/1
router.put('/:id', editUser); // PUT /api/users/1 (Untuk Edit User) [cite: 101, 150]
export default router;