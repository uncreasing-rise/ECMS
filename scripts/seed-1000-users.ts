import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DIRECT_URL or DATABASE_URL');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const branch = await prisma.branch.findFirst({ orderBy: { name: 'asc' } });
    const baseHash = await bcrypt.hash('user123', 10);

    const users = Array.from({ length: 1000 }, (_, index) => {
      const n = index + 1;
      return {
        firstName: `Load${n}`,
        lastName: 'User',
        email: `load.user.${n}@ecms.local`,
        phone: `09${String(10000000 + n).slice(-8)}`,
        accountType: 'student',
        status: 'active',
        passwordHash: baseHash,
        emailVerifiedAt: new Date(),
        branchId: branch?.id,
      };
    });

    const result = await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    const total = await prisma.user.count();
    console.log(`Inserted: ${result.count}`);
    console.log(`Total users: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
