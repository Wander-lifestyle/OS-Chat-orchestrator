'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

type AgentLevel = 3 | 4 | 5;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AgentLevelOption = {
  level: AgentLevel;
  name: string;
  description: string;
};

const AGENT_LEVEL_OPTIONS: AgentLevelOption[] = [
  { level: 3, name: 'Level 3', description: 'Fast and efficient' },
  { level: 4, name: 'Level 4', description: 'Balanced' },
  { level: 5, name: 'Level 5', description: 'Most capable' },
];

const QUICK_ACTIONS = [
  { label: 'Run security audit' },
  { label: 'Generate API docs' },
  { label: 'Create new feature' },
  { label: 'Debug issue' },
];

const API_BASE_URL = (process.env.NEXT_PUBLIC_EDITORIAL_OS_API_BASE_URL || '')
  .replace(/\/$/, '');

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const handleChange = () => setIsMobile(media.matches);

    handleChange();
    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  return isMobile;
};

const AgentLevelSelector = ({
  value,
  onChange,
}: {
  value: AgentLevel;
  onChange: (value: AgentLevel) => void;
}) => {
  const selected = AGENT_LEVEL_OPTIONS.find((option) => option.level === value);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">Agent level</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as AgentLevel)}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 shadow-sm"
      >
        {AGENT_LEVEL_OPTIONS.map((option) => (
          <option key={option.level} value={option.level}>
            {option.name} - {option.description}
          </option>
        ))}
      </select>
      <span className="text-xs text-slate-500">
        {selected?.description}
      </span>
    </div>
  );
};

const ChatInput = ({
  onSend,
  placeholder,
  disabled,
  agentLevel,
  onAgentLevelChange,
}: {
  onSend: (content: string) => void;
  placeholder: string;
  disabled: boolean;
  agentLevel: AgentLevel;
  onAgentLevelChange: (value: AgentLevel) => void;
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <AgentLevelSelector value={agentLevel} onChange={onAgentLevelChange} />
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {disabled ? 'Running...' : 'Send'}
          </button>
        </div>
      </div>
    </form>
  );
};

const ChatMessages = ({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading: boolean;
}) => (
  <div className="space-y-4">
    {messages.map((message) => (
      <div
        key={message.id}
        className={cn(
          'flex',
          message.role === 'user' ? 'justify-end' : 'justify-start'
        )}
      >
        <div
          className={cn(
            'max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm',
            message.role === 'user'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-900 border border-slate-200'
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    ))}
    {isLoading && (
      <div className="flex justify-start">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Claude is thinking...
        </div>
      </div>
    )}
  </div>
);

const QuickActions = ({
  actions,
  onActionClick,
}: {
  actions: Array<{ label: string }>;
  onActionClick: (label: string) => void;
}) => (
  <div className="flex flex-wrap justify-center gap-2">
    {actions.map((action) => (
      <button
        key={action.label}
        onClick={() => onActionClick(action.label)}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
      >
        {action.label}
      </button>
    ))}
  </div>
);

const ProjectSidebar = ({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <aside
    className={cn(
      'fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white shadow-sm transition-transform duration-300',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )}
  >
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
      <span className="text-sm font-semibold text-slate-900">Projects</span>
      <button
        onClick={onToggle}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
      >
        {isOpen ? 'Close' : 'Open'}
      </button>
    </div>
    <div className="space-y-3 px-4 py-4 text-sm text-slate-600">
      <p className="font-medium text-slate-900">Editorial OS</p>
      <p>Bridge + Claude Code</p>
      <p>Notion outputs</p>
    </div>
  </aside>
);

export default function Home() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentLevel, setAgentLevel] = useState<AgentLevel>(4);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/run-editorial-os`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            agentLevel,
          }),
        }
      );

      let data: { status?: string; response?: string } | null = null;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Failed to parse response JSON', error);
      }

      if (!response.ok) {
        throw new Error(data?.response || response.statusText);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.response || 'Command completed with no output.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : 'Error: Unable to reach the bridge.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (label: string) => {
    handleSendMessage(label);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ProjectSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
        )}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 sm:hidden"
            >
              Menu
            </button>
            <span className="text-lg font-semibold">Editorial OS</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden sm:inline">Bridge online</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
              U
            </div>
          </div>
        </header>

        <div
          className={cn(
            'mx-auto flex min-h-[calc(100vh-72px)] max-w-4xl flex-col px-4 sm:px-6',
            hasMessages ? 'py-6' : 'items-center justify-center py-12'
          )}
        >
          {!hasMessages && (
            <div className="w-full max-w-2xl space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  What can I help you build?
                </h1>
                <p className="text-sm text-slate-600 sm:text-base">
                  Ask Editorial OS to create, debug, or improve your projects.
                </p>
              </div>

              <ChatInput
                onSend={handleSendMessage}
                placeholder="Ask Editorial OS to help..."
                disabled={isLoading}
                agentLevel={agentLevel}
                onAgentLevelChange={setAgentLevel}
              />

              <QuickActions
                actions={QUICK_ACTIONS}
                onActionClick={handleQuickAction}
              />
            </div>
          )}

          {hasMessages && (
            <>
              <div className="flex-1 overflow-y-auto pb-4">
                <ChatMessages messages={messages} isLoading={isLoading} />
                <div ref={messagesEndRef} />
              </div>
              <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 pt-4 pb-6">
                <ChatInput
                  onSend={handleSendMessage}
                  placeholder="Ask Editorial OS to help..."
                  disabled={isLoading}
                  agentLevel={agentLevel}
                  onAgentLevelChange={setAgentLevel}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
