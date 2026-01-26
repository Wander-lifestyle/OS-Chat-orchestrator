"use client";

import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ProjectStatus from './components/ProjectStatus';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [clientId, setClientId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  const briefUrl = process.env.NEXT_PUBLIC_BRIEF_ENTRY_URL;
  const damUrl = process.env.NEXT_PUBLIC_LIGHT_DAM_URL;

  const handleSubmit = async (message: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: message,
          clientId: clientId || undefined,
          workspaceId: workspaceId || undefined,
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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Editorial OS</h1>
          <p>Campaign command center</p>
        </div>

        <ProjectStatus
          trackId="3"
          clientId={clientId || undefined}
          workspaceId={workspaceId || undefined}
        />
      </aside>

      <main className="main">
        <div className="main-header">
          <h2>Start a request</h2>
          <p>Describe the work you want shipped. The agent will handle the rest.</p>
        </div>

        <ChatInterface
          onSubmit={handleSubmit}
          loading={loading}
          clientId={clientId}
          workspaceId={workspaceId}
          onClientIdChange={setClientId}
          onWorkspaceIdChange={setWorkspaceId}
          briefUrl={briefUrl}
          damUrl={damUrl}
        />

        {response && (
          <div className="response-panel">
            <div className="response-title">Agent response</div>
            <p>{response}</p>
          </div>
        )}
      </main>
    </div>
  );
}
