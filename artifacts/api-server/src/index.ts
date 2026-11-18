import app from "./app";
import { logger } from "./lib/logger";
import { startSlackBot, stopSlackBot } from "./lib/slack-bot";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  void startSlackBot();
});

function shutdown(): void {
  server.close();
  void stopSlackBot().catch(() => {
    logger.error("Could not close the Slack connection cleanly");
    process.exitCode = 1;
  });
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
