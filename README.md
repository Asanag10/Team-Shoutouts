# Team Shout-outs

A Node.js backend for Slack. `/compliment` acknowledges the command and posts one randomly selected, professional compliment in the channel that invoked it. Slack Bolt receives commands over Socket Mode; there is no website, public Slack Request URL, or database.

The **API Server** workflow owns the long-running bot process. It reads `SLACK_APP_TOKEN` and `SLACK_BOT_TOKEN` from its environment (Replit Secrets). Slack app metadata is in `slack-app-manifest.yaml`; the app-level token uses `connections:write`. Socket Mode connection and command errors are logged without credentials, message data, or raw Slack responses. `/api/healthz` is only an HTTP process liveness check: it does not indicate whether Slack is connected.

Run focused command checks with `pnpm --filter @workspace/api-server test`.
