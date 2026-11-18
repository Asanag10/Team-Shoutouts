import assert from "node:assert/strict";
import { test } from "node:test";
import { createComplimentHandler } from "../src/lib/compliment-command.ts";

test("acknowledges the command before posting one message to its channel", async () => {
  const calls = [];
  const handle = createComplimentHandler({ warn: () => assert.fail("Unexpected warning") });
  await handle({
    ack: async () => {
      await Promise.resolve();
      calls.push("ack");
    },
    command: { channel_id: "C123", text: "ignored command input" },
    client: { chat: { postMessage: async (message) => { calls.push(message); } } },
    respond: async () => assert.fail("Unexpected response"),
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0], "ack");
  assert.equal(calls[1].channel, "C123");
  assert.ok(calls[1].text.length > 0);
  assert.ok(!calls[1].text.includes("ignored command input"));
});

test("privately reports a posting failure without logging raw Slack data", async () => {
  const logs = [];
  const replies = [];
  const handle = createComplimentHandler({ warn: (...args) => logs.push(args) });
  await handle({
    ack: async () => {},
    command: { channel_id: "C123" },
    client: { chat: { postMessage: async () => {
      throw { data: { error: "not_in_channel", privateDetail: "do not log" } };
    } } },
    respond: async (reply) => { replies.push(reply); },
  });
  assert.equal(replies.length, 1);
  assert.equal(replies[0].response_type, "ephemeral");
  assert.match(replies[0].text, /Add Team Shout-outs to this channel/);
  assert.deepEqual(logs[0][0], { code: "not_in_channel" });
});
