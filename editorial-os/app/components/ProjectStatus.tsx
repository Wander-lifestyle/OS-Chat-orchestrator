"use client";

import { useEffect, useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  track: string;
  status: string;
  approvalStatus: string;
  createdDate: string;
  url: string;
}

export default function ProjectStatus({ trackId }: { trackId?: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const url = trackId ? `/api/notion/ledger?trackId=${trackId}` : '/api/notion/ledger';
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
    };

    fetchLedger();

    const interval = setInterval(fetchLedger, 5000);
    return () => clearInterval(interval);
  }, [trackId]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Campaign Ledger</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Campaign</th>
            <th className="border p-2 text-left">Track</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Approval</th>
            <th className="border p-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 ? (
            <tr>
              <td colSpan={5} className="border p-4 text-center text-gray-500">
                No campaigns yet
              </td>
            </tr>
          ) : (
            campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="border p-2">
                  <a
                    href={campaign.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {campaign.name}
                  </a>
                </td>
                <td className="border p-2">{campaign.track}</td>
                <td className="border p-2">{campaign.status}</td>
                <td className="border p-2">{campaign.approvalStatus}</td>
                <td className="border p-2">{campaign.createdDate}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
