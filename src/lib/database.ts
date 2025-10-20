import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./auth-schema";
import { env } from "./env";

const pool = new Pool({
  host: env.postgres.host,
  port: env.postgres.port,
  user: env.postgres.user,
  password: env.postgres.password,
  database: env.postgres.database,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;

export { schema };
export const connectionPool = pool;
