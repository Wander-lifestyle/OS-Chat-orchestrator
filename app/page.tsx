import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#1f1c18]">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-6">
          <div className="text-sm uppercase tracking-[0.2em] text-[#8c7f72]">
            Editorial OS
          </div>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Newsletter production, now in chat.
          </h1>
          <p className="max-w-2xl text-base text-[#4a4037] md:text-lg">
            Upload files, ask for drafts, and iterate with Claude. Evergreen newsletter
            skills load server-side so your clients never see your playbooks.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/chat"
              className="rounded-full bg-[#1f1c18] px-6 py-3 text-sm font-semibold text-[#f7f4ef] transition hover:bg-[#2a2622]"
            >
              Start Chat
            </Link>
            <div className="rounded-full border border-[#e6dfd6] bg-white px-6 py-3 text-sm text-[#6b5f54]">
              Demo client: evergreen-demo
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Upload',
              description:
                'Drop .txt, .md, or .docx files. We extract text server-side on every request.',
            },
            {
              title: 'Draft',
              description:
                'Claude returns full newsletter drafts with subject lines, CTAs, and QA notes.',
            },
            {
              title: 'Iterate',
              description:
                'Multi-turn chat keeps context in your session so you can refine quickly.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#e6dfd6] bg-white/80 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-[#5c5146]">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}