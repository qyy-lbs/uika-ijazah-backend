import prisma from '../lib/prisma';

export class DashboardRepository {
  
  // Get batch statistics
  async getBatchStatistics() {
    const total = await prisma.batch_upload.count();
    
    const currentYear = new Date().getFullYear();
    const thisYearBatches = await prisma.batch_upload.count({
      where: { tahun_lulus: currentYear }
    });
    
    const lastYearBatches = await prisma.batch_upload.count({
      where: { tahun_lulus: currentYear - 1 }
    });

    return { 
      totalBatches: total, 
      thisYearBatches, 
      lastYearBatches 
    };
  }

  // Get batch upload summary
  async getBatchUploadSummary() {
    const batchStats = await prisma.batch_upload.aggregate({
      _sum: {
        total_record: true,
        record_berhasil: true,
        record_gagal: true,
      },
      _count: {
        id_batch_upload: true,
      },
    });

    const recentBatches = await prisma.batch_upload.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { email: true },
        },
        template: {
          select: { jenis_template: true },
        },
      },
    });

    return {
      summary: {
        total_batches: batchStats._count.id_batch_upload,
        total_records: batchStats._sum.total_record || 0,
        total_success: batchStats._sum.record_berhasil || 0,
        total_failed: batchStats._sum.record_gagal || 0,
      },
      recent_batches: recentBatches,
    };
  }

  // Get student statistics
  async getStudentStatistics() {
    const totalStudents = await prisma.mahasiswa.count();
    const graduatedStudents = await prisma.mahasiswa.count({ 
      where: { status_kelulusan: 'lulus' } 
    });
    
    const byProgram = await prisma.mahasiswa.groupBy({
      by: ['program'],
      _count: { id_mahasiswa: true },
    });

    const programStats = [];
    for (let i = 0; i < byProgram.length; i++) {
      programStats.push({
        program: byProgram[i].program,
        total: byProgram[i]._count.id_mahasiswa
      });
    }

    return { 
      totalStudents, 
      graduatedStudents,
      pendingValidation: totalStudents - graduatedStudents,
      byProgram: programStats
    };
  }

  // Get pending approvals from validasi table
  async getPendingApprovals() {
    const pendingByLevel = await prisma.validasi.groupBy({
      by: ['level_validasi', 'status_validasi'],
      where: { 
        status_validasi: 'pending' 
      },
      _count: { 
        id_validasi: true 
      },
    });

    const result: Record<number, number> = {};
    for (let i = 0; i < pendingByLevel.length; i++) {
      const level = pendingByLevel[i];
      result[level.level_validasi] = level._count.id_validasi;
    }

    return result;
  }

  // Get recent activities
  async getRecentActivities(limit: number = 10) {
    const activities = await prisma.log_aktivitas.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { 
            email: true, 
            role: true,
            unit: {
              select: { nama_unit: true }
            }
          },
        },
      },
    });

    return activities;
  }

  // Get document statistics
  async getDocumentStatistics() {
    const totalDocuments = await prisma.dokumen.count();
    const verifiedDocuments = await prisma.dokumen.count({ where: { is_verified: true } });
    
    const byType = await prisma.dokumen.groupBy({
      by: ['jenis_dokumen'],
      _count: { id_dokumen: true },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const issuedThisMonth = await prisma.dokumen.count({
      where: {
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    const typeStats = [];
    for (let i = 0; i < byType.length; i++) {
      typeStats.push({
        jenis: byType[i].jenis_dokumen,
        total: byType[i]._count.id_dokumen
      });
    }

    return {
      totalDocuments,
      verifiedDocuments,
      unverifiedDocuments: totalDocuments - verifiedDocuments,
      issuedThisMonth,
      byType: typeStats
    };
  }

  // Get graduates by year distribution
  async getGraduatesByYear() {
    const tahunLulusStats = await prisma.mahasiswa.groupBy({
      by: ['tahun_lulus'],
      _count: { id_mahasiswa: true },
      where: {
        tahun_lulus: { not: null },
        status_kelulusan: 'lulus',
      },
      orderBy: {
        tahun_lulus: 'asc',
      },
    });

    const yearStats = [];
    for (let i = 0; i < tahunLulusStats.length; i++) {
      yearStats.push({
        tahun: tahunLulusStats[i].tahun_lulus,
        total: tahunLulusStats[i]._count.id_mahasiswa,
      });
    }

    return yearStats;
  }

  // Get students by prodi
  async getStudentsByProdi() {
    const mahasiswaByProdi = await prisma.mahasiswa.groupBy({
      by: ['id_prodi'],
      _count: { id_mahasiswa: true },
      where: { id_prodi: { not: null } },
    });

    const prodiIds: number[] = [];
    for (let i = 0; i < mahasiswaByProdi.length; i++) {
      const id = mahasiswaByProdi[i].id_prodi;
      if (id !== null) {
        prodiIds.push(id);
      }
    }

    const prodis = await prisma.prodi.findMany({
      where: { id_prodi: { in: prodiIds } },
      select: { id_prodi: true, nama_prodi: true },
    });

    const result = [];
    for (let i = 0; i < mahasiswaByProdi.length; i++) {
      const prodiItem = mahasiswaByProdi[i];
      let prodiName = 'Unknown';
      
      for (let j = 0; j < prodis.length; j++) {
        if (prodis[j].id_prodi === prodiItem.id_prodi) {
          prodiName = prodis[j].nama_prodi;
          break;
        }
      }
      
      result.push({
        prodi_id: prodiItem.id_prodi,
        prodi_name: prodiName,
        total_mahasiswa: prodiItem._count.id_mahasiswa,
      });
    }

    return result;
  }

  // Get recent graduates
  async getRecentGraduates(limit: number = 10) {
    const recentGraduates = await prisma.mahasiswa.findMany({
      take: limit,
      where: {
        status_kelulusan: 'lulus',
      },
      orderBy: {
        tanggal_kelulusan: 'desc',
      },
      include: {
        prodi: {
          select: { nama_prodi: true },
        },
      },
    });

    return recentGraduates;
  }

  // Get IPK distribution
  async getIPKDistribution() {
    const ipkRanges = [
      { min: 3.51, max: 4.0, label: 'Cumlaude (3.51-4.00)' },
      { min: 3.01, max: 3.5, label: 'Sangat Memuaskan (3.01-3.50)' },
      { min: 2.76, max: 3.0, label: 'Memuaskan (2.76-3.00)' },
      { min: 2.51, max: 2.75, label: 'Cukup (2.51-2.75)' },
      { min: 0, max: 2.5, label: 'Kurang (0-2.50)' },
    ];

    const distribution = [];
    for (let i = 0; i < ipkRanges.length; i++) {
      const range = ipkRanges[i];
      const count = await prisma.mahasiswa.count({
        where: {
          ipk: {
            gte: range.min,
            lte: range.max,
          },
          status_kelulusan: 'lulus',
        },
      });
      distribution.push({ range: range.label, count });
    }

    return distribution;
  }

  // Get daily document issuance trend
  async getDailyIssuance(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const dailyData = await prisma.$queryRaw<Array<{ date: Date; total: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total
        FROM "dokumen"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const formattedData = [];
    for (let i = 0; i < dailyData.length; i++) {
      formattedData.push({
        date: dailyData[i].date,
        total: Number(dailyData[i].total),
      });
    }

    return formattedData;
  }

  // Get monthly trend
  async getMonthlyTrend(year: number = new Date().getFullYear()) {
    const monthlyData = await prisma.$queryRaw<Array<{ month: number; total: bigint }>>`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as total
      FROM "dokumen"
      WHERE EXTRACT(YEAR FROM created_at) = ${year}
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month ASC
    `;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formattedData = [];
    for (let i = 0; i < monthlyData.length; i++) {
      const monthNum = Number(monthlyData[i].month);
      formattedData.push({
        month: monthNum,
        month_name: monthNames[monthNum - 1],
        total: Number(monthlyData[i].total),
      });
    }

    return formattedData;
  }

  // Get total counts for all entities
  async getTotalCounts() {
    const [totalMahasiswa, totalDokumen, totalUsers, totalBatchUpload] = await Promise.all([
      prisma.mahasiswa.count(),
      prisma.dokumen.count(),
      prisma.users.count(),
      prisma.batch_upload.count(),
    ]);

    return {
      total_mahasiswa: totalMahasiswa,
      total_dokumen: totalDokumen,
      total_users: totalUsers,
      total_batch_upload: totalBatchUpload,
    };
  }

  // Get all dashboard stats in one call
  async getAllDashboardStats() {
    const batchStats = await this.getBatchStatistics();
    const studentStats = await this.getStudentStatistics();
    const documentStats = await this.getDocumentStatistics();
    const pendingApprovals = await this.getPendingApprovals();
    const recentActivities = await this.getRecentActivities(10);
    const graduatesByYear = await this.getGraduatesByYear();
    const studentsByProdi = await this.getStudentsByProdi();

    return {
      batches: batchStats,
      students: studentStats,
      documents: documentStats,
      pendingApprovals: pendingApprovals,
      recentActivities: recentActivities,
      graduatesByYear: graduatesByYear,
      studentsByProdi: studentsByProdi,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new DashboardRepository();