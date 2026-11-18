import { Router, type IRouter } from "express";
import { GetSlackStatusResponse } from "@workspace/api-zod";
import { getSlackStatus } from "../lib/slack-bot";

const router: IRouter = Router();

router.get("/slack/status", (_req, res) => {
  res.set("Cache-Control", "no-store").json(GetSlackStatusResponse.parse(getSlackStatus()));
});

export default router;
