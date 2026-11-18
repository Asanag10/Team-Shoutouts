# Team Shout-outs

Type `/compliment` in Slack and the bot posts a randomly selected positive message in that channel. Slack Bolt receives the command over Socket Mode, so Slack does not need a public request URL. The web preview only shows setup instructions and connection status.

## Set up Slack

1. In [Slack Your Apps](https://api.slack.com/apps), create an app **From a manifest**, select your workspace, and paste `slack-app-manifest.yaml`. This enables Socket Mode, registers `/compliment`, and requests the `commands` and `chat:write` bot scopes.
2. Under **Basic Information → App-Level Tokens**, generate a token with `connections:write`. Save it as `SLACK_APP_TOKEN` in Replit Secrets.
3. Install the app to your workspace. Under **OAuth & Permissions**, copy the **Bot User OAuth Token** and save it as `SLACK_BOT_TOKEN` in Replit Secrets. Do not put either token in source code or chat.
4. Restart **API Server** so it picks up the secrets. Add the bot to a Slack channel and run `/compliment`.

## Keep the bot running

On Replit, use an always-on **Reserved VM** rather than an app that scales to zero. Supply the same named secrets to the deployment. The API Server process owns the connection; the web preview does not have to be open. For another Node.js host, build with `pnpm --filter @workspace/api-server run build`, provide `PORT` and both Slack environment variables, then supervise `pnpm --filter @workspace/api-server run start`.
