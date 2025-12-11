import tmi from "tmi.js";
import { redis } from "./redisClient";
import { stopwords } from "./stopwords";
import { config } from "./config";

const WORD_REGEX = /[a-zA-Z0-9]+/g;

export class ChatIngestor {
  private client: tmi.Client;

  constructor() {
    this.client = new tmi.Client({
      connection: { reconnect: true, secure: true },
      identity: {
        username: config.twitch.username,
        password: config.twitch.oauthToken,
      },
      channels: config.twitch.channels.map((c) =>
        c.startsWith("#") ? c : `#${c}`
      ),
    });
  }

  async start(): Promise<void> {
    this.client.on("message", (_channel, _tags, message, self) => {
      if (self) return;
      const channel = normalizeChannel(_channel);
      const words = tokenize(message);
      if (words.length === 0) return;
      this.incrementCounts(channel, words).catch((err) => {
        console.error("Failed to increment counts", err);
      });
    });

    await this.client.connect();
    console.log("Connected to Twitch IRC");
  }

  private async incrementCounts(
    channel: string,
    words: string[]
  ): Promise<void> {
    if (words.length === 0) return;
    const key = redisKey(channel);
    const pipeline = redis.pipeline();
    for (const word of words) {
      pipeline.zincrby(key, 1, word);
    }
    pipeline.expire(key, 60 * 60 * 24); // 24h TTL to avoid unbounded growth
    await pipeline.exec();
  }
}

function normalizeChannel(raw: string): string {
  return raw.replace(/^#/, "").toLowerCase();
}

function tokenize(message: string): string[] {
  const matches = message.toLowerCase().match(WORD_REGEX);
  if (!matches) return [];
  return matches.filter((word) => word.length > 1 && !stopwords.has(word));
}

export function redisKey(channel: string): string {
  return `chat:words:${channel}`;
}

