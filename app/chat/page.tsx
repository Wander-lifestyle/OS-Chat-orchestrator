'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Role = 'user' | 'assistant';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: AttachmentMeta[];
  status?: 'streaming' | 'complete' | 'error';
}

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.docx'];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const truncate = (value: string, length = 60) =>
  value.length > length ? `${value.slice(0, length - 3)}...` : value;

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes('base64,') ? result.split('base64,')[1] : result;
      resolve(base64 || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content:
        'Tell me what you want to draft. Example:\n"Draft a newsletter about winter cooking with 3 recipes from my uploaded doc."',
      status: 'complete',
    },
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sessionMessages = useMemo(
    () => messages.filter((message) => message.role === 'user'),
    [messages]
  );

  const uploadedFiles = useMemo(
    () =>
      messages
        .flatMap((message) => message.attachments || [])
        .map((file) => ({ ...file, key: `${file.id}-${file.name}` })),
    [messages]
  );

  const handleFiles = async (fileList: FileList | File[]) => {
    const nextFiles = Array.from(fileList);
    if (nextFiles.length === 0) return;

    const invalid = nextFiles.filter(
      (file) => !ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    );

    if (invalid.length > 0) {
      setUploadError('Only .txt, .md, and .docx files are supported.');
    } else {
      setUploadError(null);
    }

    const validFiles = nextFiles.filter((file) =>
      ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    );

    const resolved = await Promise.all(
      validFiles.map(async (file) => ({
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        type: file.type,
        content: await readFileAsBase64(file),
      }))
    );

    setAttachments((current) => [...current, ...resolved]);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    await handleFiles(event.dataTransfer.files);
  };

  const handleSend = async () => {
    if (isSending) return;
    if (!input.trim() && attachments.length === 0) return;

    const messageText = input.trim() || 'Please use the attached files.';
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: messageText,
      attachments: attachments.map(({ id, name, size, type }) => ({
        id,
        name,
        size,
        type,
      })),
      status: 'complete',
    };

    const assistantId = `${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'streaming',
    };

    const conversationHistory = messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({ role: message.role, content: message.content }));

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput('');
    setAttachments([]);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          files: attachments.map(({ name, content }) => ({ name, content })),
          conversationHistory,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Chat request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: buffer, status: 'streaming' }
              : message
          )
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: buffer, status: 'complete' }
            : message
        )
      );
    } catch (error) {
      console.error(error);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: 'Something went wrong. Please try again.',
                status: 'error',
              }
            : message
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#1f1c18]">
      <div className="flex min-h-screen">
        <aside className="hidden w-16 flex-col items-center gap-4 border-r border-[#eee6dd] bg-[#f3eee6] py-6 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f1c18] text-sm font-semibold text-[#f7f4ef]">
            EO
          </div>
          <div className="flex flex-col gap-3 text-[#8c7f72]">
            {['+', 'S', 'C', 'F', '</>'].map((icon) => (
              <div
                key={icon}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
              >
                <span className="text-sm">{icon}</span>
              </div>
            ))}
          </div>
        </aside>

        <aside className="hidden w-72 flex-col border-r border-[#eee6dd] bg-[#f9f6f1] p-6 lg:flex">
          <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[#8c7f72]">
            All projects
          </Link>
          <div className="mt-4 text-lg font-semibold">Newsletter Assistant</div>
          <div className="mt-1 text-sm text-[#8c7f72]">Session history</div>

          <div className="mt-6 space-y-3 overflow-y-auto">
            {sessionMessages.length === 0 && (
              <div className="text-sm text-[#b3a79c]">No messages yet</div>
            )}
            {sessionMessages.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                className="rounded-2xl border border-[#eee6dd] bg-white px-4 py-3 text-sm text-[#4a4037] shadow-sm"
              >
                {truncate(message.content)}
              </div>
            ))}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee6dd] bg-[#faf7f3] px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#8c7f72]">
                Editorial OS
              </div>
              <h1 className="text-lg font-semibold">Newsletter Chat</h1>
            </div>
            <div className="text-xs text-[#8c7f72]">Model: claude-sonnet-4</div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col gap-2 ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`w-full rounded-3xl border px-5 py-4 text-sm leading-relaxed shadow-sm ${
                      message.role === 'user'
                        ? 'border-[#e7dcd1] bg-white'
                        : 'border-[#e9e0d6] bg-[#fffdfa]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h2 className="mt-4 text-lg font-semibold text-[#2a2420]">
                                  {children}
                                </h2>
                              ),
                              h2: ({ children }) => (
                                <h3 className="mt-3 text-base font-semibold text-[#2a2420]">
                                  {children}
                                </h3>
                              ),
                              h3: ({ children }) => (
                                <h4 className="mt-3 text-sm font-semibold text-[#2a2420]">
                                  {children}
                                </h4>
                              ),
                              p: ({ children }) => (
                                <p className="mt-2 text-sm text-[#2a2420]">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2a2420]">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#2a2420]">
                                  {children}
                                </ol>
                              ),
                              pre: ({ children }) => (
                                <pre className="mt-3 overflow-x-auto rounded-2xl bg-[#f2ede6] p-4 text-xs text-[#4a4037]">
                                  {children}
                                </pre>
                              ),
                              code: ({ className, children }) => {
                                const isBlock = Boolean(className);
                                return (
                                  <code
                                    className={
                                      isBlock
                                        ? 'text-xs text-[#4a4037]'
                                        : 'rounded bg-[#f2ede6] px-1 py-0.5 text-xs text-[#6b5f54]'
                                    }
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {message.content || (message.status === 'streaming' ? '...' : '')}
                          </ReactMarkdown>
                        </div>
                        <button
                          onClick={() => handleCopy(message)}
                          className="rounded-full border border-[#e6dfd6] bg-white px-3 py-1 text-xs text-[#6b5f54] hover:border-[#d7cabd]"
                        >
                          {copiedId === message.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-[#2a2420]">
                        {message.content}
                      </p>
                    )}

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.attachments.map((file) => (
                          <div
                            key={file.id}
                            className="rounded-full border border-[#e6dfd6] bg-[#f6f1ea] px-3 py-1 text-xs text-[#6b5f54]"
                          >
                            {file.name} - {formatFileSize(file.size)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.status === 'error' && (
                    <div className="text-xs text-red-500">Response failed.</div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-[#eee6dd] bg-[#faf7f3] px-6 py-6">
            <div
              className={`mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-3xl border bg-white px-4 py-4 shadow-sm transition ${
                dragActive ? 'border-[#cdbfae] bg-[#fff9f2]' : 'border-[#e6dfd6]'
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6dfd6] text-[#6b5f54] hover:border-[#d7cabd]"
                >
                  +
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.docx"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) {
                      handleFiles(event.target.files);
                      event.target.value = '';
                    }
                  }}
                />
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Reply..."
                  className="flex-1 resize-none bg-transparent text-sm text-[#2a2420] outline-none placeholder:text-[#a29488]"
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || (!input.trim() && attachments.length === 0)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f1c18] text-[#f7f4ef] transition hover:bg-[#2a2622] disabled:cursor-not-allowed disabled:bg-[#c9beb3]"
                >
                  {isSending ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <span className="text-sm">^</span>
                  )}
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded-full border border-[#e6dfd6] bg-[#f6f1ea] px-3 py-1 text-xs text-[#6b5f54]"
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={() =>
                          setAttachments((current) =>
                            current.filter((item) => item.id !== file.id)
                          )
                        }
                        className="text-[#a29488]"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && <div className="text-xs text-red-500">{uploadError}</div>}
            </div>
          </div>
        </main>

        <aside className="hidden w-80 flex-col gap-6 border-l border-[#eee6dd] bg-[#faf7f3] p-6 xl:flex">
          <div>
            <div className="text-xs font-semibold text-[#6b5f54]">Memory</div>
            <div className="mt-2 rounded-2xl border border-[#eee6dd] bg-white px-4 py-3 text-xs text-[#7b6f64]">
              Client context is loaded server-side for this demo.
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#6b5f54]">Instructions</div>
            <div className="mt-2 rounded-2xl border border-[#eee6dd] bg-white px-4 py-3 text-xs text-[#7b6f64]">
              Evergreen newsletter skills run automatically behind the scenes.
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#6b5f54]">Files</div>
            <div className="mt-2 space-y-2">
              {uploadedFiles.length === 0 && (
                <div className="rounded-2xl border border-[#eee6dd] bg-white px-4 py-3 text-xs text-[#b3a79c]">
                  No files uploaded yet.
                </div>
              )}
              {uploadedFiles.map((file) => (
                <div
                  key={file.key}
                  className="rounded-2xl border border-[#eee6dd] bg-white px-4 py-3 text-xs text-[#6b5f54]"
                >
                  <div className="font-medium text-[#4a4037]">{file.name}</div>
                  <div>{formatFileSize(file.size)}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
