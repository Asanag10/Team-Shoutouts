import { randomInt } from "node:crypto";
import { App, LogLevel, SocketModeReceiver, type Logger } from "@slack/bolt";
import type { SlackStatus } from "@workspace/api-zod";
import { logger } from "./logger";

const compliments = [
  "Your thoughtfulness makes this team better.",
  "Thanks for showing up for each other. It makes a difference.",
  "The care you put into your work doesn't go unnoticed.",
  "You make hard things feel a little easier for the people around you.",
  "The way you share what you know helps everyone do better work.",
  "Thanks for making this a team people can count on.",
  "Your curiosity and good questions make our work stronger.",
  "You make it easier for people to speak up and do their best work.",
] as const;

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

function slackErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) return;
  const data = error.data;
  if (typeof data !== "object" || data === null || !("error" in data)) return;
  if (typeof data.error === "string" && /^[a-z_]{1,60}$/.test(data.error)) {
    return data.error;
  }
  return undefined;
}

let status: SlackStatus["status"] = "unconfigured";
let bot: App | undefined;
let stopping = false;

export function getSlackStatus(): SlackStatus {
  return { status };
}

export async function startSlackBot(): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  const appToken = process.env.SLACK_APP_TOKEN?.trim();
  if (!token || !appToken) {
    logger.warn("Slack is not configured. Set SLACK_BOT_TOKEN and SLACK_APP_TOKEN to start the bot.");
    return;
  }
  if (!token.startsWith("xoxb-") || !appToken.startsWith("xapp-")) {
    status = "error";
    logger.error("Expected a bot token in SLACK_BOT_TOKEN and an app-level token in SLACK_APP_TOKEN.");
    return;
  }

  status = "connecting";
  try {
    const receiver = new SocketModeReceiver({ appToken, logger: slackLogger });
    const app = new App({ token, receiver, logger: slackLogger });
    bot = app;
    receiver.client.on("connecting", () => { if (!stopping) status = "connecting"; });
    receiver.client.on("reconnecting", () => { if (!stopping) status = "connecting"; });
    receiver.client.on("connected", () => {
      if (stopping) return;
      status = "connected";
      logger.info("Team Shout-outs connected to Slack");
    });
    receiver.client.on("disconnected", () => {
      if (status !== "error") status = "disconnected";
    });

    app.error(async (error) => {
      logger.error({ code: slackErrorCode(error) }, "Slack event handler failed");
    });
    app.command("/compliment", async ({ ack, command, client, respond }) => {
      await ack();
      try {
        await client.chat.postMessage({
          channel: command.channel_id,
          text: compliments[randomInt(compliments.length)]!,
        });
      } catch (error) {
        const code = slackErrorCode(error);
        logger.warn({ code }, "Could not post a compliment in Slack");
        const text = code === "not_in_channel" || code === "channel_not_found"
          ? "I couldn't post here. Add Team Shout-outs to this channel and try again."
          : "I couldn't post a compliment right now. Please try again later.";
        await respond({ response_type: "ephemeral", text });
      }
    });

    await app.start();
  } catch (error) {
    if (!stopping) {
      status = "error";
      logger.error({ code: slackErrorCode(error) }, "Could not connect to Slack. Check the bot and app tokens and restart.");
    }
  }
}

export async function stopSlackBot(): Promise<void> {
  stopping = true;
  await bot?.stop();
}
