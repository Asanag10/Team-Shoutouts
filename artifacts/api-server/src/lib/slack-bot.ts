import { App, LogLevel, SocketModeReceiver, type Logger } from "@slack/bolt";
import { createComplimentHandler, slackErrorCode } from "./compliment-command";
import { logger } from "./logger";

// SDK diagnostics may contain Slack message data or temporary WebSocket URLs.
const slackLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() { logger.error("Slack SDK reported an error"); },
  setLevel() {},
  getLevel() { return LogLevel.ERROR; },
  setName() {},
};

let bot: App | undefined;
let stopping = false;

export async function startSlackBot(): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  const appToken = process.env.SLACK_APP_TOKEN?.trim();
  if (!token || !appToken) {
    logger.error("Slack bot did not start: SLACK_BOT_TOKEN or SLACK_APP_TOKEN is missing.");
    return;
  }
  if (!token.startsWith("xoxb-") || !appToken.startsWith("xapp-")) {
    logger.error("Expected a bot token in SLACK_BOT_TOKEN and an app-level token in SLACK_APP_TOKEN.");
    return;
  }

  logger.info("Starting Team Shout-outs in Slack Socket Mode");
  let phase = "verify bot authorization";
  try {
    const receiver = new SocketModeReceiver({ appToken, logger: slackLogger, autoReconnectEnabled: true });
    const app = new App({ token, receiver, logger: slackLogger, deferInitialization: true });
    bot = app;
    receiver.client.on("reconnecting", () => {
      if (!stopping) logger.info("Reconnecting to Slack Socket Mode");
    });
    receiver.client.on("connected", () => {
      if (!stopping) logger.info("Team Shout-outs connected to Slack; /compliment is ready");
    });
    receiver.client.on("disconnected", () => {
      if (!stopping) logger.warn("Slack Socket Mode disconnected");
    });

    app.error(async (error) => {
      logger.error({ code: slackErrorCode(error) }, "Slack event handler failed");
    });
    app.command("/compliment", createComplimentHandler(logger));

    await app.init();
    if (stopping) return;
    phase = "open the Socket Mode connection";
    await app.start();
  } catch (error) {
    if (!stopping) {
      logger.error({ phase, code: slackErrorCode(error) }, "Slack bot did not start");
    }
  }
}

export async function stopSlackBot(): Promise<void> {
  stopping = true;
  await bot?.stop();
}
