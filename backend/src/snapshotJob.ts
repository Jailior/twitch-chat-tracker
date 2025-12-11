import cron from "node-cron";
import { redis } from "./redisClient";
import { pgPool } from "./postgresClient";
import { config } from "./config";
import { redisKey } from "./chatIngestor";

export function startSnapshotJob(): void {
  cron.schedule(config.snapshotCron, async () => {
    try {
      await snapshotOnce();
    } catch (err) {
      console.error("Snapshot job failed", err);
    }
  });
  console.log(`Snapshot job scheduled with cron ${config.snapshotCron}`);
}

async function snapshotOnce(): Promise<void> {
  const topN = config.snapshotTopN;
  const now = new Date();

  for (const channel of config.twitch.channels) {
    const key = redisKey(channel);
    const entries = await redis.zrevrange(key, 0, topN - 1, "WITHSCORES");
    if (entries.length === 0) continue;

    const values: Array<{ word: string; count: number }> = [];
    for (let i = 0; i < entries.length; i += 2) {
      values.push({ word: entries[i], count: Number(entries[i + 1]) });
    }

    const insertValues: Array<string> = [];
    const params: Array<string | number | Date> = [];
    values.forEach((v, idx) => {
      const base = idx * 4;
      insertValues.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      params.push(channel, v.word, v.count, now);
    });

    const sql = `
      INSERT INTO word_snapshots (channel, word, count, captured_at)
      VALUES ${insertValues.join(",")}
    `;
    await pgPool.query(sql, params);
  }
}

