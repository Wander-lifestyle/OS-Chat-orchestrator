"use client";

import { type FormEvent, useState } from 'react';

interface ChatInterfaceProps {
  onSubmit: (message: string) => Promise<void>;
  loading: boolean;
  clientId: string;
  workspaceId: string;
  onClientIdChange: (value: string) => void;
  onWorkspaceIdChange: (value: string) => void;
  briefUrl?: string;
  damUrl?: string;
}

export default function ChatInterface({
  onSubmit,
  loading,
  clientId,
  workspaceId,
  onClientIdChange,
  onWorkspaceIdChange,
  briefUrl,
  damUrl,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;

    await onSubmit(message);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="chat-form">
      <div className="chat-fields">
        <label className="chat-field">
          <span>Client ID (optional)</span>
          <input
            type="text"
            value={clientId}
            onChange={(event) => onClientIdChange(event.target.value)}
            placeholder="e.g. wander"
          />
        </label>
        <label className="chat-field">
          <span>Workspace ID (optional)</span>
          <input
            type="text"
            value={workspaceId}
            onChange={(event) => onWorkspaceIdChange(event.target.value)}
            placeholder="e.g. north-america"
          />
        </label>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Describe what you want to create..."
        disabled={loading}
        rows={4}
      />

      <div className="chat-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Send request'}
        </button>
      </div>

      <div className="chat-tabs">
        {briefUrl ? (
          <a className="chat-tab" href={briefUrl} target="_blank" rel="noreferrer">
            Brief entry
          </a>
        ) : (
          <span className="chat-tab disabled" title="Set NEXT_PUBLIC_BRIEF_ENTRY_URL">
            Brief entry
          </span>
        )}
        {damUrl ? (
          <a className="chat-tab" href={damUrl} target="_blank" rel="noreferrer">
            Light DAM
          </a>
        ) : (
          <span className="chat-tab disabled" title="Set NEXT_PUBLIC_LIGHT_DAM_URL">
            Light DAM
          </span>
        )}
      </div>
    </form>
  );
}
