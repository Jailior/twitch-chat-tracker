import { config } from "./config";
import { ensureSchema } from "./postgresClient";
import { buildApp } from "./api";
import { ChatIngestor } from "./chatIngestor";
import { startSnapshotJob } from "./snapshotJob";

async function main() {
  await ensureSchema();

  const ingestor = new ChatIngestor();
  await ingestor.start();

  startSnapshotJob();

  const app = buildApp();
  app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("Fatal error", err);
  process.exit(1);
});

