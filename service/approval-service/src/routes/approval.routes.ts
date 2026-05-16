// src/routes/approval.routes.ts

import { 
  approveData, 
  rejectData,      // <-- Pastikan namanya 'rejectData', bukan 'bulkRejectData'
  revokeData, 
  revisiData, 
  getRiwayatApproval,
  bulkApproveData,
  bulkRevisiData  
} from '../controllers/approval.controller.js'; 

import { Router } from 'express';
const router = Router();

// Routes Satuan
router.post('/approve', approveData);
router.post('/revoke', revokeData); // Sesuai KAK: Reject Individu
router.post('/revisi', revisiData);
router.get('/riwayat/:id_mahasiswa', getRiwayatApproval);

// Routes Massal (Batch)
router.post('/bulk-approve', bulkApproveData);
router.post('/reject', rejectData); // URL tetap /reject tapi memanggil fungsi rejectData
router.post('/bulk-revisi', bulkRevisiData);

export default router;