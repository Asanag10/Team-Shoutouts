import { randomInt } from "node:crypto";
import type { SlackCommandMiddlewareArgs } from "@slack/bolt";
import type { logger } from "./logger";

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

// Log only Slack error identifiers, never raw requests, responses, or errors.
export function slackErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) return;
  const data = error.data;
  if (typeof data !== "object" || data === null || !("error" in data)) return;
  if (typeof data.error === "string" && /^[a-z_]{1,60}$/.test(data.error)) {
    return data.error;
  }
  return undefined;
}

type CommandContext = Pick<SlackCommandMiddlewareArgs, "ack" | "command" | "respond"> & {
  client: { chat: { postMessage(message: { channel: string; text: string }): Promise<unknown> } };
};

export function createComplimentHandler(log: Pick<typeof logger, "warn">) {
  return async ({ ack, command, client, respond }: CommandContext): Promise<void> => {
    await ack();
    try {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: compliments[randomInt(compliments.length)]!,
      });
    } catch (error) {
      const code = slackErrorCode(error);
      log.warn({ code }, "Could not post a compliment in Slack");
      const text = code === "not_in_channel" || code === "channel_not_found"
        ? "I couldn't post here. Add Team Shout-outs to this channel and try again."
        : "I couldn't post a compliment right now. Please try again later.";
      await respond({ response_type: "ephemeral", text });
    }
  };
}
