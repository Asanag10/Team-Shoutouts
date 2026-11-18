import { useState } from 'react';
import { useGetSlackStatus, getGetSlackStatusQueryKey } from '@workspace/api-client-react';
import type { SlackStatus } from '@workspace/api-client-react';
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react';

type StatusKey = SlackStatus['status'] | 'loading' | 'unavailable';

const STATUS: Record<StatusKey, { label: string; tone: string; dot: string; body: string }> = {
  loading: { label: 'Checking', tone: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/50 animate-pulse', body: 'Asking the API server how the bot is doing.' },
  unavailable: { label: 'Preview endpoint unavailable', tone: 'bg-destructive/10 text-destructive', dot: 'bg-destructive', body: 'The status endpoint did not respond. Make sure the API Server workflow is running, then retry.' },
  unconfigured: { label: 'Not configured', tone: 'bg-secondary text-secondary-foreground', dot: 'bg-[hsl(42_90%_50%)]', body: 'SLACK_APP_TOKEN and SLACK_BOT_TOKEN are not both set yet. Follow the steps below, then restart the API Server workflow.' },
  connecting: { label: 'Connecting', tone: 'bg-secondary text-secondary-foreground', dot: 'bg-[hsl(42_90%_50%)] animate-pulse', body: 'Tokens found. Opening a Socket Mode connection to Slack.' },
  connected: { label: 'Connected', tone: 'bg-accent text-accent-foreground', dot: 'bg-[hsl(160_45%_35%)]', body: 'The bot is listening. Type /compliment in any channel it has been added to.' },
  disconnected: { label: 'Disconnected', tone: 'bg-muted text-foreground', dot: 'bg-muted-foreground', body: 'The Socket Mode connection dropped. It may reconnect on its own; if not, restart the API Server workflow.' },
  error: { label: 'Error', tone: 'bg-destructive/10 text-destructive', dot: 'bg-destructive', body: 'Slack rejected the connection. Check that both tokens are correct, Socket Mode is enabled, and the app-level token has connections:write.' },
};

const STEPS: { title: string; body: React.ReactNode }[] = [
  { title: 'Create a Slack app', body: <>Go to <a className="underline decoration-primary/40 underline-offset-4 hover:decoration-primary" href="https://api.slack.com/apps" target="_blank" rel="noreferrer" data-testid="link-slack-apps">api.slack.com/apps<ExternalLink className="ml-1 inline h-3 w-3" /></a> and create a new app from scratch in your workspace.</> },
  { title: 'Enable Socket Mode', body: <>Turn on Socket Mode and create an app-level token with the <Code>connections:write</Code> scope. This is your <Code>SLACK_APP_TOKEN</Code>.</> },
  { title: 'Add bot scopes', body: <>Under OAuth and Permissions, add the bot token scopes <Code>commands</Code> and <Code>chat:write</Code>.</> },
  { title: 'Register the slash command', body: <>In Slash Commands, create <Code>/compliment</Code>. With Socket Mode on, no request URL is needed.</> },
  { title: 'Install and invite', body: <>Install the app to your workspace, copy the Bot User OAuth Token (<Code>SLACK_BOT_TOKEN</Code>), and add the bot to the channel where you want it.</> },
  { title: 'Save secrets and restart', body: <>Save <Code>SLACK_APP_TOKEN</Code> and <Code>SLACK_BOT_TOKEN</Code> in Replit Secrets, then restart the API Server workflow.</> },
];

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.82em] text-foreground">{children}</code>;
}

function CopyChip({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      data-testid={`button-copy-${value.toLowerCase()}`}
      onClick={() => { navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1400); }); }}
      className="group inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 font-mono text-xs transition-colors hover:border-primary/50 active:translate-y-px"
    >
      {value}
      {done ? <Check className="h-3.5 w-3.5 text-[hsl(160_45%_35%)]" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />}
    </button>
  );
}

export default function Home() {
  const q = useGetSlackStatus({ query: { queryKey: getGetSlackStatusQueryKey(), refetchInterval: 5000 } });
  const key: StatusKey = q.isLoading ? 'loading' : q.isError || !q.data ? 'unavailable' : q.data.status;
  const s = STATUS[key];

  return (
    <main className="min-h-[100dvh] px-5 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Internal · setup and connection</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
            Team <span className="text-primary">Shout-outs</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            A Slack bot that turns one slash command into a little encouragement for the whole channel.
          </p>
        </header>

        <section data-testid="card-status" className="relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 md:p-8">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span data-testid="status-slack" className={`inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${s.tone}`}>
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <button
              type="button"
              data-testid="button-refresh-status"
              onClick={() => q.refetch()}
              disabled={q.isFetching}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${q.isFetching ? 'animate-spin' : ''}`} />
              {key === 'unavailable' ? 'Retry' : 'Refresh'}
            </button>
          </div>
          {key === 'loading' ? (
            <div className="mt-5 space-y-2">
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <p data-testid="text-status-detail" className="mt-5 max-w-xl text-base leading-relaxed">{s.body}</p>
          )}
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">Checked automatically every 5 seconds</p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight">How to use it</h2>
          <div className="mt-5 rounded-2xl bg-secondary p-6 md:p-8">
            <p className="font-mono text-lg font-medium text-secondary-foreground">/compliment</p>
            <p className="mt-3 text-secondary-foreground/80">
              Type it in any channel the bot has been added to. The bot posts a random positive message to that channel.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight">Setup</h2>
          <ol className="mt-6 space-y-0">
            {STEPS.map((step, i) => (
              <li key={step.title} data-testid={`step-setup-${i + 1}`} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-border py-6">
                <span className="font-mono text-sm text-primary">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <span className="text-sm text-muted-foreground">Secret names:</span>
            <CopyChip value="SLACK_APP_TOKEN" />
            <CopyChip value="SLACK_BOT_TOKEN" />
          </div>
        </section>

        <footer className="mt-20 font-mono text-xs text-muted-foreground">
          Tokens live only in Replit Secrets. This page never asks for them.
        </footer>
      </div>
    </main>
  );
}
