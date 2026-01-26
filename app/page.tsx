'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Project {
  ledger_id: string;
  project_name: string;
  status: string;
  updated_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  intake: 'bg-yellow-400',
  active: 'bg-blue-400',
  scheduled: 'bg-green-400',
  shipped: 'bg-purple-400',
  draft: 'bg-zinc-400',
};

export default function EditorialOSChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content:
        'Tell me what you want to ship. Example:\n' +
        '"Create newsletter for this week. Theme: Valentine\'s weekend getaway"',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error(error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message || 'No response received.',
      };

      setMessages([...nextMessages, assistantMessage]);
      fetchProjects();
    } catch (error) {
      console.error(error);
      setMessages([
        ...nextMessages,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [fetchProjects, input, isSending, messages]);

  const statusCounts = projects.reduce<Record<string, number>>((acc, project) => {
    const key = project.status || 'draft';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <aside className="w-80 border-r border-zinc-800 bg-zinc-900/70 p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Editorial OS</h1>
          <p className="text-sm text-zinc-400">Campaign command center</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
            <span>Status</span>
            <button
              onClick={fetchProjects}
              className="text-zinc-400 hover:text-zinc-200"
            >
              Refresh
            </button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            {Object.keys(statusCounts).length === 0 && (
              <div className="text-zinc-500">No campaigns yet</div>
            )}
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    STATUS_STYLES[status] || 'bg-zinc-500'
                  }`}
                />
                <span className="capitalize">{status}</span>
                <span className="ml-auto text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Projects
          </div>
          <div className="mt-3 space-y-2">
            {projectsLoading && (
              <div className="text-sm text-zinc-500">Loading...</div>
            )}
            {!projectsLoading && projects.length === 0 && (
              <div className="text-sm text-zinc-500">
                No projects found yet
              </div>
            )}
            {projects.map((project) => (
              <button
                key={project.ledger_id}
                onClick={() => setSelectedProjectId(project.ledger_id)}
                className={`w-full rounded-lg border border-zinc-800 px-3 py-2 text-left text-sm transition ${
                  selectedProjectId === project.ledger_id
                    ? 'bg-zinc-800/80'
                    : 'hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-100">
                    {project.project_name}
                  </span>
                  <span
                    className={`ml-2 h-2 w-2 rounded-full ${
                      STATUS_STYLES[project.status] || 'bg-zinc-500'
                    }`}
                  />
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {project.ledger_id} • {project.status}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="border-b border-zinc-800 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Chat</h2>
              <p className="text-sm text-zinc-400">
                Launch campaigns, write, schedule, report.
              </p>
            </div>
            <div className="text-xs text-zinc-500">
              {selectedProjectId ? `Selected: ${selectedProjectId}` : 'No project selected'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                Working...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-zinc-800 px-8 py-6">
          <div className="flex items-center gap-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Create newsletter for this week..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}