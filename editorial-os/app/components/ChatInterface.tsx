"use client";

import { useState } from 'react';

interface ChatInterfaceProps {
  onSubmit: (message: string) => Promise<void>;
  loading: boolean;
}

export default function ChatInterface({ onSubmit, loading }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;

    await onSubmit(message);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto p-4 border rounded-lg bg-white"
    >
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Describe what you want to create..."
        disabled={loading}
        className="w-full p-3 border rounded"
        rows={3}
      />

      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Create'}
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          DAM
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Brief
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Schedule
        </button>
      </div>
    </form>
  );
}
