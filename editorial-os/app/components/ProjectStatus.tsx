"use client";

import { useCallback, useEffect, useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  track: string;
  status: string;
  approvalStatus: string;
  createdDate: string;
  url: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  intake: 'Intake',
  active: 'Active',
  scheduled: 'Scheduled',
  shipped: 'Shipped',
};

const STATUS_CLASSNAMES: Record<string, string> = {
  draft: 'status-dot status-dot--draft',
  intake: 'status-dot status-dot--intake',
  active: 'status-dot status-dot--active',
  scheduled: 'status-dot status-dot--scheduled',
  shipped: 'status-dot status-dot--shipped',
};

export default function ProjectStatus({
  trackId,
  clientId,
  workspaceId,
}: {
  trackId?: string;
  clientId?: string;
  workspaceId?: string;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (trackId) params.set('trackId', trackId);
      if (clientId) params.set('clientId', clientId);
      if (workspaceId) params.set('workspaceId', workspaceId);

      const url = params.toString()
        ? `/api/notion/ledger?${params.toString()}`
        : '/api/notion/ledger';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Ledger fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [trackId, clientId, workspaceId]);

  useEffect(() => {
    fetchLedger();

    const interval = setInterval(fetchLedger, 5000);
    return () => clearInterval(interval);
  }, [fetchLedger]);

  const statusCounts = campaigns.reduce<Record<string, number>>((acc, campaign) => {
    const key = (campaign.status || 'draft').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <span>Status</span>
        <button
          type="button"
          className="sidebar-action"
          onClick={() => {
            setLoading(true);
            fetchLedger();
          }}
        >
          Refresh
        </button>
      </div>

      <div className="status-list">
        {Object.keys(statusCounts).length === 0 && !loading && (
          <div className="status-empty">No campaigns yet</div>
        )}
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="status-item">
            <span className={STATUS_CLASSNAMES[status] || 'status-dot'} />
            <span>{STATUS_LABELS[status] || status}</span>
            <span className="status-count">{count}</span>
          </div>
        ))}
        {loading && <div className="status-empty">Loading...</div>}
      </div>

      <div className="sidebar-section-divider" />

      <div className="sidebar-section-header">
        <span>Projects</span>
      </div>

      <div className="project-list">
        {loading && campaigns.length === 0 && <div className="project-empty">Loading...</div>}
        {!loading && campaigns.length === 0 && (
          <div className="project-empty">No projects found yet</div>
        )}
        {campaigns.map((campaign) => {
          const statusKey = (campaign.status || 'draft').toLowerCase();
          return (
            <a
              key={campaign.id}
              href={campaign.url}
              target="_blank"
              rel="noreferrer"
              className="project-card"
            >
              <div className="project-header">
                <span className="project-name">{campaign.name}</span>
                <span className={STATUS_CLASSNAMES[statusKey] || 'status-dot'} />
              </div>
              <div className="project-meta">
                {campaign.track} • {campaign.status}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
