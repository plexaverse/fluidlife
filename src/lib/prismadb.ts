import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

console.log("Initializing Prisma with DATABASE_URL check...");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing!");
} else {
  try {
    new URL(process.env.DATABASE_URL);
    console.log("DATABASE_URL is a valid URL format.");
  } catch (e) {
    console.error("DATABASE_URL is NOT a valid URL format:", process.env.DATABASE_URL);
  }
}

// const pool = new pg.Pool({ 
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });
// const adapter = new PrismaPg(pool as any);
// const prismadb = globalThis.prisma || new PrismaClient({ adapter });

const prismadb = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prismadb;

export default prismadb;
