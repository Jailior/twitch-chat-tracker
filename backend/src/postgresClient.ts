import { Pool } from "pg";
import { config } from "./config";

export const pgPool = new Pool({
  connectionString: config.postgresUrl,
});

export async function ensureSchema(): Promise<void> {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS word_snapshots (
      id BIGSERIAL PRIMARY KEY,
      channel TEXT NOT NULL,
      word TEXT NOT NULL,
      count BIGINT NOT NULL,
      captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

