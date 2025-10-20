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

const requiredEnv: EnvKey[] = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

function readEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  betterAuth: {
    secret: readEnv("BETTER_AUTH_SECRET"),
    baseURL: readEnv("BETTER_AUTH_URL"),
  },
  postgres: {
    host: readEnv("POSTGRES_HOST"),
    port: (() => {
      const parsed = Number(readEnv("POSTGRES_PORT"));
      if (Number.isNaN(parsed)) {
        throw new Error("POSTGRES_PORT must be a valid number");
      }
      return parsed;
    })(),
    user: readEnv("POSTGRES_USER"),
    password: readEnv("POSTGRES_PASSWORD"),
    database: readEnv("POSTGRES_DB"),
  },
  stripe: {
    secretKey: readEnv("STRIPE_SECRET_KEY"),
    webhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  },
} as const;
