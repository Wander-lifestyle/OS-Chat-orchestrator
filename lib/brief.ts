export interface CampaignDetails {
  name: string;
  objective: string;
  audience?: string;
  channels: string[];
  region?: string;
}

export interface Brief {
  id: string;
  projectName: string;
  objective: string;
  audience: string;
  keyMessage: string;
  channels: string[];
  tone: string[];
  createdAt: string;
}

function generateBriefId() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `BRF-${date}-${random}`;
}

export function createBrief(details: CampaignDetails): Brief {
  const audience = details.audience || 'Target customers';
  const keyMessage = `Introducing ${details.name} for ${audience.toLowerCase()}.`;

  return {
    id: generateBriefId(),
    projectName: details.name,
    objective: details.objective,
    audience,
    keyMessage,
    channels: details.channels,
    tone: ['clear', 'confident', 'helpful'],
    createdAt: new Date().toISOString(),
  };
}
