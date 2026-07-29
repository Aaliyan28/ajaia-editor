import "dotenv/config";
import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The three seeded users reviewers switch between to test sharing.
const users = [
  { name: "Alice", email: "alice@ajaia.dev" },
  { name: "Bob", email: "bob@ajaia.dev" },
  { name: "Carol", email: "carol@ajaia.dev" },
];

async function main() {
  for (const user of users) {
    // upsert keeps the seed idempotent — safe to run repeatedly.
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: user,
    });
    console.log(`Seeded user: ${record.name} <${record.email}>`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
