import { Router } from 'express';
import { createUser, getAllUsers, deleteUser, editUser ,changePassword} from '../controllers/userController.js';
import { verifyToken, authorizeRoles } from '../middlewares/masterMiddleware.js';
import { getCurrentUser, /* fungsi lain... */ } from "../controllers/userController.js";

const router = Router();

router.use(verifyToken);
router.put('/changePassword', changePassword);

router.post('/createUser', authorizeRoles('admin'), createUser);
router.get('/getAllUser', authorizeRoles('admin'), getAllUsers);
router.delete('/deleteUser/:id', authorizeRoles('admin'), deleteUser);
router.put('/editUser/:id', authorizeRoles('admin'), editUser);

export default router;