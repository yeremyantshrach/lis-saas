import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const requiredEnvVars = [
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
];

for (const key of requiredEnvVars) {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: false,
});

const db = drizzle(pool);

try {
  console.info("Running Drizzle migrations...");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.info("Drizzle migrations complete.");
} catch (error) {
  console.error("Failed to run Drizzle migrations.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
