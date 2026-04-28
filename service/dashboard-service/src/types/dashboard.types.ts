// src/types/dashboard.types.ts
export interface BatchStats {
  totalBatches: number;
  thisYearBatches: number;
  lastYearBatches: number;
}

export interface StudentStats {
  totalStudents: number;
  graduatedStudents: number;
  pendingValidation: number;
  byProgram: Array<{
    program: string | null;
    total: number;
  }>;
}

export interface DocumentStats {
  totalDocuments: number;
  verifiedDocuments: number;
  unverifiedDocuments: number;
  issuedThisMonth: number;
  byType: Array<{
    jenis: string;
    total: number;
  }>;
}

export interface PendingApproval {
  level: number;
  levelName: string;
  pendingCount: number;
}

export interface Activity {
  id_log: number;
  uuid: string | null;
  id_user: number | null;
  aktivitas: string | null;
  deskripsi: string | null;
  created_at: Date | null;
  users?: {
    email: string;
    role: string | null;
    unit?: {
      nama_unit: string;
    } | null;
  } | null;
}

export interface DashboardStats {
  batches: BatchStats;
  students: StudentStats;
  documents: DocumentStats;
  pendingApprovals: PendingApproval[];
  recentActivities: Activity[];
  timestamp: string;
}

export interface BatchUploadSummary {
  summary: {
    total_batches: number;
    total_records: number;
    total_success: number;
    total_failed: number;
  };
  recent_batches: any[];
}

export interface GraduatesByYear {
  tahun: number | null;
  total: number;
}

export interface StudentsByProdi {
  prodi_id: number | null;
  prodi_name: string;
  total_mahasiswa: number;
}