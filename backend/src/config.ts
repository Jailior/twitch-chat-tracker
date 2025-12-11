import dotenv from "dotenv";

dotenv.config();

const env = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (!value || value.length === 0) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

export const config = {
  port: Number(env("PORT", "4000")),
  redisUrl: env("REDIS_URL"),
  postgresUrl: env("POSTGRES_URL"),
  twitch: {
    username: env("TWITCH_IRC_USERNAME"),
    oauthToken: env("TWITCH_IRC_OAUTH_TOKEN"),
    channels: env("TWITCH_CHANNELS")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  },
  snapshotCron: env("SNAPSHOT_CRON", "*/5 * * * *"),
  snapshotTopN: Number(env("SNAPSHOT_TOP_N", "10")),
};

if (config.twitch.channels.length === 0) {
  throw new Error("TWITCH_CHANNELS must list at least one channel");
}

