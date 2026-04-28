import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './lib/prisma';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;
const SERVICE_NAME = process.env.SERVICE_NAME || 'dashboard-service';

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH & METRICS ENDPOINTS ====================

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1 as connected`;
    res.status(200).json({
      status: 'healthy',
      service: SERVICE_NAME,
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: SERVICE_NAME,
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Metrics endpoint (optional)
if (process.env.METRICS_ENABLED === 'true') {
  app.get(process.env.METRICS_PATH || '/metrics', (req: Request, res: Response) => {
    res.status(200).json({
      service: SERVICE_NAME,
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
      },
    });
  });
}

// ==================== DASHBOARD STATISTICS ENDPOINTS ====================

// 1. Get total counts
app.get('/api/dashboard/stats/total', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalMahasiswa, totalDokumen, totalUsers, totalBatchUpload] = await Promise.all([
      prisma.mahasiswa.count(),
      prisma.dokumen.count(),
      prisma.users.count(),
      prisma.batch_upload.count(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_mahasiswa: totalMahasiswa,
        total_dokumen: totalDokumen,
        total_users: totalUsers,
        total_batch_upload: totalBatchUpload,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 2. Get dokumen statistics by status
app.get('/api/dashboard/stats/dokumen', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dokumenByType = await prisma.dokumen.groupBy({
      by: ['jenis_dokumen'],
      _count: {
        id_dokumen: true,
      },
    });

    const verifiedCount = await prisma.dokumen.count({
      where: { is_verified: true },
    });

    const unverifiedCount = await prisma.dokumen.count({
      where: { is_verified: false },
    });

    // Fix: Use for loop instead of map
    const byType = [];
    for (let i = 0; i < dokumenByType.length; i++) {
      byType.push({
        jenis: dokumenByType[i].jenis_dokumen,
        count: dokumenByType[i]._count.id_dokumen,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        by_type: byType,
        verified: verifiedCount,
        unverified: unverifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 3. Get mahasiswa by prodi
app.get('/api/dashboard/stats/mahasiswa-by-prodi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mahasiswaByProdi = await prisma.mahasiswa.groupBy({
      by: ['id_prodi'],
      _count: {
        id_mahasiswa: true,
      },
      where: {
        id_prodi: { not: null },
      },
    });

    // Filter out null prodi ids using for loop
    const prodiIds: number[] = [];
    for (let i = 0; i < mahasiswaByProdi.length; i++) {
      const id = mahasiswaByProdi[i].id_prodi;
      if (id !== null) {
        prodiIds.push(id);
      }
    }

    const prodis = await prisma.prodi.findMany({
      where: {
        id_prodi: { in: prodiIds },
      },
      select: {
        id_prodi: true,
        nama_prodi: true,
      },
    });

    // Fix: Use for loop instead of map
    const result = [];
    for (let i = 0; i < mahasiswaByProdi.length; i++) {
      const mahasiswaItem = mahasiswaByProdi[i];
      let prodiName = 'Unknown';
      
      for (let j = 0; j < prodis.length; j++) {
        if (prodis[j].id_prodi === mahasiswaItem.id_prodi) {
          prodiName = prodis[j].nama_prodi;
          break;
        }
      }
      
      result.push({
        prodi_id: mahasiswaItem.id_prodi,
        prodi_name: prodiName,
        total_mahasiswa: mahasiswaItem._count.id_mahasiswa,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// 4. Get recent activities
app.get('/api/dashboard/activities/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const activities = await prisma.log_aktivitas.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        users: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

// 5. Get batch upload statistics
app.get('/api/dashboard/stats/batch-upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      orderBy: {
        created_at: 'desc',
      },
      include: {
        users: {
          select: {
            email: true,
          },
        },
      },
    });

    const totalRecords = batchStats._sum.total_record || 0;
    const totalSuccess = batchStats._sum.record_berhasil || 0;
    const totalFailed = batchStats._sum.record_gagal || 0;
    const successRate = totalRecords > 0 ? (totalSuccess / totalRecords) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_batches: batchStats._count.id_batch_upload,
          total_records: totalRecords,
          total_success: totalSuccess,
          total_failed: totalFailed,
          success_rate: successRate.toFixed(2),
        },
        recent_batches: recentBatches,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 6. Get tahun lulus distribution
app.get('/api/dashboard/stats/tahun-lulus', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tahunLulusStats = await prisma.mahasiswa.groupBy({
      by: ['tahun_lulus'],
      _count: {
        id_mahasiswa: true,
      },
      where: {
        tahun_lulus: { not: null },
      },
      orderBy: {
        tahun_lulus: 'asc',
      },
    });

    // Fix: Use for loop instead of map
    const result = [];
    for (let i = 0; i < tahunLulusStats.length; i++) {
      result.push({
        tahun: tahunLulusStats[i].tahun_lulus,
        total: tahunLulusStats[i]._count.id_mahasiswa,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// 7. Get recent graduates
app.get('/api/dashboard/graduates/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const recentGraduates = await prisma.mahasiswa.findMany({
      take: limit,
      where: {
        status_kelulusan: 'Lulus',
      },
      orderBy: {
        tanggal_kelulusan: 'desc',
      },
      include: {
        prodi: {
          select: {
            nama_prodi: true,
          },
        },
      },
    });

    // Fix: Use for loop instead of map
    const formattedGraduates = [];
    for (let i = 0; i < recentGraduates.length; i++) {
      const graduate = recentGraduates[i];
      formattedGraduates.push({
        id_mahasiswa: graduate.id_mahasiswa,
        nim: graduate.nim,
        nama_mahasiswa: graduate.nama_mahasiswa,
        program: graduate.program,
        ipk: graduate.ipk,
        predikat: graduate.predikat,
        tahun_lulus: graduate.tahun_lulus,
        tanggal_kelulusan: graduate.tanggal_kelulusan,
        prodi: graduate.prodi,
      });
    }

    res.status(200).json({
      success: true,
      data: formattedGraduates,
    });
  } catch (error) {
    next(error);
  }
});

// 8. Get dashboard overview (combined stats)
app.get('/api/dashboard/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalMahasiswa,
      totalDokumen,
      totalVerified,
      totalUsers,
      recentActivities,
      batchStats,
      totalBatchUpload,
    ] = await Promise.all([
      prisma.mahasiswa.count(),
      prisma.dokumen.count(),
      prisma.dokumen.count({ where: { is_verified: true } }),
      prisma.users.count(),
      prisma.log_aktivitas.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: { email: true, role: true },
          },
        },
      }),
      prisma.batch_upload.aggregate({
        _sum: {
          total_record: true,
          record_berhasil: true,
        },
      }),
      prisma.batch_upload.count(),
    ]);

    const verificationRate = totalDokumen > 0 ? (totalVerified / totalDokumen) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_mahasiswa: totalMahasiswa,
          total_dokumen: totalDokumen,
          total_verified_dokumen: totalVerified,
          total_users: totalUsers,
          total_batch_upload: totalBatchUpload,
          verification_rate: verificationRate.toFixed(2),
          total_records_processed: batchStats._sum.total_record || 0,
          total_success_records: batchStats._sum.record_berhasil || 0,
        },
        recent_activities: recentActivities,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 9. Get IPK distribution
app.get('/api/dashboard/stats/ipk-distribution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipkRanges = [
      { min: 3.51, max: 4.0, label: 'Cumlaude (3.51-4.00)' },
      { min: 3.01, max: 3.5, label: 'Sangat Memuaskan (3.01-3.50)' },
      { min: 2.76, max: 3.0, label: 'Memuaskan (2.76-3.00)' },
      { min: 2.51, max: 2.75, label: 'Cukup (2.51-2.75)' },
      { min: 0, max: 2.5, label: 'Kurang (0-2.50)' },
    ];

    // Fix: Use for loop instead of Promise.all with map
    const distribution = [];
    for (let i = 0; i < ipkRanges.length; i++) {
      const range = ipkRanges[i];
      const count = await prisma.mahasiswa.count({
        where: {
          ipk: {
            gte: range.min,
            lte: range.max,
          },
          status_kelulusan: 'Lulus',
        },
      });
      distribution.push({ range: range.label, count });
    }

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    next(error);
  }
});

// 10. Get daily document issuance
app.get('/api/dashboard/stats/daily-issuance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
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

    // Fix: Use for loop instead of map
    const formattedData = [];
    for (let i = 0; i < dailyData.length; i++) {
      formattedData.push({
        date: dailyData[i].date,
        total: Number(dailyData[i].total),
      });
    }

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
});

// 11. Get prodi statistics
app.get('/api/dashboard/stats/prodi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prodiStats = await prisma.prodi.findMany({
      select: {
        id_prodi: true,
        nama_prodi: true,
        _count: {
          select: {
            mahasiswa: true,
            akademik: true,
          },
        },
      },
      orderBy: {
        nama_prodi: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: prodiStats,
    });
  } catch (error) {
    next(error);
  }
});

// 12. Get document issuance trend by month
app.get('/api/dashboard/stats/monthly-trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
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
    
    // Fix: Use for loop instead of map
    const formattedData = [];
    for (let i = 0; i < monthlyData.length; i++) {
      const monthNum = Number(monthlyData[i].month);
      formattedData.push({
        month: monthlyData[i].month,
        month_name: monthNames[monthNum - 1],
        total: Number(monthlyData[i].total),
      });
    }

    res.status(200).json({
      success: true,
      data: formattedData,
      year: year,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 404 HANDLER ====================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// ==================== ERROR HANDLER ====================

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error.message);
  console.error(error.stack);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// ==================== START SERVER ====================

async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Database connection established (Neon PostgreSQL with Prisma v7)');
    
    app.listen(PORT, () => {
      console.log(`\n🚀 ${SERVICE_NAME} is running on port ${PORT}`);
      console.log(`📊 Base URL: http://localhost:${PORT}`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      if (process.env.METRICS_ENABLED === 'true') {
        console.log(`📈 Metrics: http://localhost:${PORT}${process.env.METRICS_PATH || '/metrics'}`);
      }
      console.log(`\n📚 Available API Endpoints:`);
      console.log(`   GET  /api/dashboard/stats/total`);
      console.log(`   GET  /api/dashboard/stats/dokumen`);
      console.log(`   GET  /api/dashboard/stats/mahasiswa-by-prodi`);
      console.log(`   GET  /api/dashboard/stats/batch-upload`);
      console.log(`   GET  /api/dashboard/stats/tahun-lulus`);
      console.log(`   GET  /api/dashboard/stats/ipk-distribution`);
      console.log(`   GET  /api/dashboard/stats/daily-issuance?days=30`);
      console.log(`   GET  /api/dashboard/stats/prodi`);
      console.log(`   GET  /api/dashboard/stats/monthly-trend?year=2026`);
      console.log(`   GET  /api/dashboard/activities/recent?limit=10`);
      console.log(`   GET  /api/dashboard/graduates/recent?limit=10`);
      console.log(`   GET  /api/dashboard/overview`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Please check your DATABASE_URL in .env file');
    process.exit(1);
  }
}

// Graceful shutdown for Prisma v7
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;