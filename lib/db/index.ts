import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../drizzle/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (typeof window !== "undefined") {
    throw new Error("Database can only be accessed on the server side");
  }

  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
}
