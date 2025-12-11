import express, { Request, Response } from "express";
import cors from "cors";
import { redis } from "./redisClient";
import { config } from "./config";
import { pgPool } from "./postgresClient";
import { redisKey } from "./chatIngestor";

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/channels", (_req, res) => {
    res.json({ channels: config.twitch.channels });
  });

  app.get("/top-words", async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) ?? "1", 10);
      const channel = (req.query.channel as string | undefined)?.toLowerCase();
      const channels = channel ? [channel] : config.twitch.channels;

      const results = await Promise.all(
        channels.map(async (ch) => ({
          channel: ch,
          words: await topWords(ch, limit),
        }))
      );

      res.json({ results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to fetch top words" });
    }
  });

  app.get("/history", async (req: Request, res: Response) => {
    const channel = (req.query.channel as string | undefined)?.toLowerCase();
    if (!channel) {
      return res.status(400).json({ error: "channel is required" });
    }
    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    try {
      const { rows } = await pgPool.query(
        `SELECT channel, word, count, captured_at
         FROM word_snapshots
         WHERE channel = $1
         ORDER BY captured_at DESC
         LIMIT $2`,
        [channel, limit]
      );
      res.json({ channel, snapshots: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to fetch history" });
    }
  });

  return app;
}

async function topWords(
  channel: string,
  limit: number
): Promise<{ word: string; count: number }[]> {
  const key = redisKey(channel);
  const entries = await redis.zrevrange(key, 0, limit - 1, "WITHSCORES");
  const pairs: { word: string; count: number }[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    pairs.push({ word: entries[i], count: Number(entries[i + 1]) });
  }
  return pairs;
}

