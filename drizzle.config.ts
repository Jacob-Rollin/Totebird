import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Prefer .env.local (Neon CLI / Next.js) then .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/totebird",
  },
});
