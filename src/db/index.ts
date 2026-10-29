import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hasDatabase } from "@/lib/env";
import * as schema from "./schema";

export function getDb() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };
