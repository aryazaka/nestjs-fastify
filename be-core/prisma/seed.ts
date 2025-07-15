import { PrismaClient } from '@prisma/client';
import { seedDummyData } from '../src/testing/dummy-data'; 

const prisma = new PrismaClient();

async function main() {
  try {
    await seedDummyData();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
