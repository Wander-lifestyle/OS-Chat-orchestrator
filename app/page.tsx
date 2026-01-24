export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Editorial OS Bridge</h1>
        <p className="mt-2 text-slate-600">
          This is a minimal Next.js bridge that forwards requests to Claude Code
          subagents.
        </p>

        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="font-medium">Available endpoints</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>
              <code>POST /api/run-editorial-os</code> - Run a Claude subagent.
            </li>
            <li>
              <code>GET /api/health</code> - Health check.
            </li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          See the README for local setup and usage examples.
        </p>
      </div>
    </main>
  );
}
