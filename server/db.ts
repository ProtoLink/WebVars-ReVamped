import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required. WebVar does not fall back to local SQLite storage.",
  );
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL connection error:", error);
});

export const db = drizzle(pool, { schema });

export async function verifyDatabaseConnection(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to managed PostgreSQL database");
  } catch (error) {
    console.error("Unable to connect to managed PostgreSQL database:", error);
    throw error;
  }
}