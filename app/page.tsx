import BriefForm from '@/components/BriefForm';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">
          Light Brief
        </span>
        <h1 className="text-3xl font-semibold text-zinc-900">
          Create a clean campaign brief in minutes.
        </h1>
        <p className="max-w-2xl text-sm text-zinc-500">
          Capture the essentials, export a PDF, and deliver the brief directly to
          Slack. No accounts, no storage, just a clean brief.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <BriefForm />
        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">What happens next</h2>
            <ul className="mt-3 space-y-3 text-sm text-zinc-500">
              <li>1. Submit the brief form.</li>
              <li>2. We generate a PDF instantly.</li>
              <li>3. Slack receives the summary + attachment.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">Slack delivery</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Uses your bot token to attach the PDF and post a structured summary to
              the target channel.
            </p>
            <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-400">
              Required env: SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}