import { DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardStats } from '../types/dashboard.types';

export class DashboardService {
  private repo: DashboardRepository;

  constructor() {
    this.repo = new DashboardRepository();
  }

  async getMainDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
    const [batchStats, studentStats, pendingApprovalsObject, recentActivities, documentStats] = await Promise.all([
      this.repo.getBatchStatistics(),
      this.repo.getStudentStatistics(),
      this.repo.getPendingApprovals(),
      this.repo.getRecentActivities(10),
      this.repo.getDocumentStatistics(),
    ]);

    // Convert pendingApprovals from Record<number, number> to array format
    const pendingApprovalsArray = [];
    const levelNames: Record<number, string> = {
      1: 'Akademik Universitas',
      2: 'Kepala TU Fakultas',
      3: 'Wakil Dekan 1',
      4: 'Dekan',
      5: 'Wakil Rektor 1',
      6: 'Rektor'
    };

    for (const level in pendingApprovalsObject) {
      if (pendingApprovalsObject.hasOwnProperty(level)) {
        const levelNum = parseInt(level);
        pendingApprovalsArray.push({
          level: levelNum,
          levelName: levelNames[levelNum] || `Level ${levelNum}`,
          pendingCount: pendingApprovalsObject[levelNum]
        });
      }
    }

    // Sort by level
    pendingApprovalsArray.sort((a, b) => a.level - b.level);

    return {
      success: true,
      data: {
        batches: batchStats,
        students: studentStats,
        documents: documentStats,
        pendingApprovals: pendingApprovalsArray,
        recentActivities: recentActivities,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Get batch upload summary
  async getBatchUploadSummary() {
    return await this.repo.getBatchUploadSummary();
  }

  // Get pending approvals
  async getPendingApprovals() {
    const pendingApprovalsObject = await this.repo.getPendingApprovals();
    
    const levelNames: Record<number, string> = {
      1: 'Akademik Universitas',
      2: 'Kepala TU Fakultas',
      3: 'Wakil Dekan 1',
      4: 'Dekan',
      5: 'Wakil Rektor 1',
      6: 'Rektor'
    };

    const result = [];
    for (const level in pendingApprovalsObject) {
      if (pendingApprovalsObject.hasOwnProperty(level)) {
        const levelNum = parseInt(level);
        result.push({
          level: levelNum,
          levelName: levelNames[levelNum] || `Level ${levelNum}`,
          pendingCount: pendingApprovalsObject[levelNum]
        });
      }
    }

    return result.sort((a, b) => a.level - b.level);
  }

  // Get graduates by year
  async getGraduatesByYear() {
    return await this.repo.getGraduatesByYear();
  }

  // Get students by prodi
  async getStudentsByProdi() {
    return await this.repo.getStudentsByProdi();
  }

  // Get recent graduates
  async getRecentGraduates(limit: number = 10) {
    const graduates = await this.repo.getRecentGraduates(limit);
    
    // Format response
    const formattedGraduates = [];
    for (let i = 0; i < graduates.length; i++) {
      const graduate = graduates[i];
      formattedGraduates.push({
        id_mahasiswa: graduate.id_mahasiswa,
        nim: graduate.nim,
        nama_mahasiswa: graduate.nama_mahasiswa,
        program: graduate.program,
        ipk: graduate.ipk,
        predikat: graduate.predikat,
        tahun_lulus: graduate.tahun_lulus,
        tanggal_kelulusan: graduate.tanggal_kelulusan,
        prodi: graduate.prodi
      });
    }
    
    return formattedGraduates;
  }

  // Get IPK distribution
  async getIPKDistribution() {
    return await this.repo.getIPKDistribution();
  }

  // Get daily issuance
  async getDailyIssuance(days: number = 30) {
    return await this.repo.getDailyIssuance(days);
  }

  // Get monthly trend
  async getMonthlyTrend(year?: number) {
    return await this.repo.getMonthlyTrend(year);
  }

  // Get total counts
  async getTotalCounts() {
    return await this.repo.getTotalCounts();
  }

  // Get all dashboard stats
  async getAllDashboardStats() {
    return await this.repo.getAllDashboardStats();
  }
}

export default new DashboardService();