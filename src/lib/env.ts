type EnvKey =
  | "BETTER_AUTH_SECRET"
  | "BETTER_AUTH_URL"
  | "POSTGRES_HOST"
  | "POSTGRES_PORT"
  | "POSTGRES_USER"
  | "POSTGRES_PASSWORD"
  | "POSTGRES_DB"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET";

const REQUIRED_ENV_KEYS = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const satisfies readonly EnvKey[];

function readEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const rawEnv = REQUIRED_ENV_KEYS.reduce<Record<EnvKey, string>>((acc, key) => {
  acc[key] = readEnv(key);
  return acc;
}, {} as Record<EnvKey, string>);

function parsePort(value: string, key: EnvKey): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${key} must be a valid number`);
  }
  return parsed;
}

export const env = {
  betterAuth: {
    secret: rawEnv.BETTER_AUTH_SECRET,
    baseURL: rawEnv.BETTER_AUTH_URL,
  },
  postgres: {
    host: rawEnv.POSTGRES_HOST,
    port: parsePort(rawEnv.POSTGRES_PORT, "POSTGRES_PORT"),
    user: rawEnv.POSTGRES_USER,
    password: rawEnv.POSTGRES_PASSWORD,
    database: rawEnv.POSTGRES_DB,
  },
  stripe: {
    secretKey: rawEnv.STRIPE_SECRET_KEY,
    webhookSecret: rawEnv.STRIPE_WEBHOOK_SECRET,
  },
} as const;
