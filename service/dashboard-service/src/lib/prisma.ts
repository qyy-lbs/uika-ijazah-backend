import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Konfigurasi connection pool untuk Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
});

// Event listeners untuk pool (debugging)
pool.on('connect', () => {
  console.log('📊 Database pool: new connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

// Buat adapter Prisma untuk menggunakan pool
const adapter = new PrismaPg(pool);

// Inisialisasi Prisma Client dengan adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn', 'info'] 
    : ['error'],
  errorFormat: 'pretty',
});

// Flag untuk mengetahui status koneksix
let isConnected = false;

// Fungsi untuk mengecek koneksi database
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Coba query sederhana untuk test koneksi
    await prisma.$queryRaw`SELECT 1 as connected`;
    if (!isConnected) {
      console.log('✅ Dashboard Service connected to Neon PostgreSQL');
      console.log(`📊 Connection pool: min=${pool.options.min}, max=${pool.options.max}`);
      console.log(`📊 Idle timeout: ${pool.options.idleTimeoutMillis}ms`);
      console.log(`📊 Connection timeout: ${pool.options.connectionTimeoutMillis}ms`);
      isConnected = true;
    }
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check:');
    console.error('  1. DATABASE_URL in .env file is correct');
    console.error('  2. Database server is running');
    console.error('  3. Network connection is available');
    return false;
  }
}

// Fungsi untuk disconnect dengan aman
async function gracefulDisconnect(): Promise<void> {
  console.log('🔄 Closing database connections...');
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
}

// Handler untuk graceful shutdown
const shutdownHandlers = async (signal: string) => {
  console.log(`\n📡 Received ${signal}, starting graceful shutdown...`);
  await gracefulDisconnect();
  console.log('👋 Service shutdown complete');
  process.exit(0);
};

// Register shutdown handlers
process.on('beforeExit', async () => {
  await gracefulDisconnect();
});

process.on('SIGINT', async () => {
  await shutdownHandlers('SIGINT');
});

process.on('SIGTERM', async () => {
  await shutdownHandlers('SIGTERM');
});

process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  await gracefulDisconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  await gracefulDisconnect();
  process.exit(1);
});

// Test koneksi saat modul dimuat (tidak blocking)
if (process.env.NODE_ENV !== 'test') {
  checkDatabaseConnection();
}

// Export prisma client dan utility functions
export default prisma;
export { checkDatabaseConnection, gracefulDisconnect, pool };