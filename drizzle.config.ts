import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();
import { defineConfig } from "drizzle-kit";

const requiredEnv = [
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
] as const;

const env = Object.fromEntries(
  requiredEnv.map((key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return [key, value];
  }),
) as Record<(typeof requiredEnv)[number], string>;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: env.POSTGRES_HOST,
    port: (() => {
      const parsed = Number(env.POSTGRES_PORT);
      if (Number.isNaN(parsed)) {
        throw new Error("POSTGRES_PORT must be a valid number");
      }
      return parsed;
    })(),
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    ssl: false,
  },
});
