import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient instance for the whole server process.
// Connection pool max is kept low (5) — appropriate for a small Cloud SQL
// shared-core instance that has a hard connection limit of ~25.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
