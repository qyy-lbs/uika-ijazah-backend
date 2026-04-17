import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

// Membuat rute POST untuk login
// URL aslinya nanti akan menjadi: /api/auth/login
router.post('/login', login);

export default router;