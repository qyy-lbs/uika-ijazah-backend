import { Router } from 'express';

// Controllers
import { login, logout, refreshToken } from '../controllers/authController.js';
import { 
  getProfile, 
  getRektoratDashboard, 
  getFakultasDashboard, 
  getOperasionalDashboard 
} from '../controllers/profileController.js';

// Middlewares
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();




// 2. Public routes (Tanpa Autentikasi)
router.post('/login', login);
router.post('/refresh', refreshToken); // Bisa diakses tanpa token (public)


// 3. PROTECTED ROUTES (Wajib Autentikasi JWT)
// verifikaai jwt
router.use(verifyToken);

router.post('/logout', logout);  // Harus login dulu baru bisa logout
// Rute Umum: Siapapun yang punya JWT bisa lihat profilnya sendiri
router.get('/profile', getProfile);


// --- PINTU BERLAPIS BERDASARKAN JABATAN ---

// A. Level Universitas (Hanya Pimpinan Pusat)
router.get('/dashboard-rektorat', 
  authorizeRoles('rektor', 'wakil_rektor', 'tu_rektorat'), 
  getRektoratDashboard
);

// B. Level Fakultas (Hanya Pimpinan Fakultas)
router.get('/dashboard-fakultas', 
  authorizeRoles('dekan', 'wakil_dekan', 'tu_fakultas'), 
  getFakultasDashboard
);

// C. Level Operasional (Hanya Tim Input Data)
router.get('/dashboard-operasional', 
  authorizeRoles('operator_data', 'admin'), 
  getOperasionalDashboard
);

export default router;