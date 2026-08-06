/**
 * Prisma Seed Script — SI-APARAT
 *
 * Membuat akun SUPER_ADMIN pertama.
 * ⚠️  WAJIB ganti password setelah login pertama!
 *
 * Jalankan: pnpm db:seed
 */

import { PrismaClient, RoleUser } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'Admin@Aparat2026!'; // Ganti setelah login pertama
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';

async function main() {
  console.log('🌱 Starting database seed...');

  // Cek apakah admin sudah ada
  const existingAdmin = await prisma.user.findUnique({
    where: { username: DEFAULT_ADMIN_USERNAME },
  });

  if (existingAdmin) {
    console.log('ℹ️  Admin account already exists. Skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash,
      role: RoleUser.SUPER_ADMIN,
      namaLengkap: 'Administrator SI-APARAT',
      email: DEFAULT_ADMIN_EMAIL,
    },
  });

  console.log('✅ SUPER_ADMIN created:');
  console.log(`   Username : ${admin.username}`);
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Role     : ${admin.role}`);
  console.log('');
  console.log('⚠️  PENTING: Segera ganti password default setelah login pertama!');
  console.log(`   Default password: ${DEFAULT_ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
