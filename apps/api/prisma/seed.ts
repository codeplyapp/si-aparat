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

declare const process: any;

const prisma = new PrismaClient();

const DEFAULT_ADMIN_USERNAME = 'moderator';
const DEFAULT_ADMIN_PASSWORD = 'MPKjosjis2026'; // Ganti setelah login pertama
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'mpksmadatara@gmail.com';

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);

  // Cari apakah sudah ada SUPER_ADMIN (atau akun dengan username/email tersebut)
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: RoleUser.SUPER_ADMIN },
        { username: DEFAULT_ADMIN_USERNAME },
        { email: DEFAULT_ADMIN_EMAIL },
      ],
    },
  });

  let admin;
  if (existingSuperAdmin) {
    admin = await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: {
        username: DEFAULT_ADMIN_USERNAME,
        passwordHash,
        email: DEFAULT_ADMIN_EMAIL,
        role: RoleUser.SUPER_ADMIN,
      },
    });
  } else {
    admin = await prisma.user.create({
      data: {
        username: DEFAULT_ADMIN_USERNAME,
        passwordHash,
        role: RoleUser.SUPER_ADMIN,
        namaLengkap: 'Administrator SI-APARAT',
        email: DEFAULT_ADMIN_EMAIL,
      },
    });
  }

  console.log('✅ SUPER_ADMIN ready:');
  console.log(`   Username : ${admin.username}`);
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Role     : ${admin.role}`);
  console.log('');
  console.log('⚠️  PENTING: Segera ganti password default setelah login pertama!');
  console.log(`   Password aktif: ${DEFAULT_ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

