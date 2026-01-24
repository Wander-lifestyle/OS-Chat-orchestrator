"use client";

import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ProjectStatus from './components/ProjectStatus';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleSubmit = async (message: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: message,
          trackId: 3,
        }),
      });

      const data = await res.json();
      setResponse(data.agentResponse || '');
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error processing request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Editorial OS</h1>

        <div className="mb-8">
          <ChatInterface onSubmit={handleSubmit} loading={loading} />
          {response && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-bold mb-2">Agent Response</h3>
              <p className="text-sm">{response}</p>
            </div>
          )}
        </div>

        <ProjectStatus trackId="3" />
      </div>
    </div>
  );
}
