import { defineConfig } from "drizzle-kit";
import "./env-config";
import { env } from "./src/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: env.postgres.host,
    port: env.postgres.port,
    user: env.postgres.user,
    password: env.postgres.password,
    database: env.postgres.database,
    ssl: false,
  },
});
