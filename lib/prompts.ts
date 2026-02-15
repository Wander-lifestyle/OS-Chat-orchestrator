import 'server-only';

import fs from 'fs';
import path from 'path';

export interface ClientContext {
  brand: string;
  audience: string;
  voice: string;
  constraints: string;
}

export interface ClientConfig {
  id: string;
  name: string;
  context: ClientContext;
}

export function loadClientConfig(): ClientConfig {
  const configPath = path.join(process.cwd(), 'config', 'evergreen-demo.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as ClientConfig;
}

export function buildSystemPrompt(config: ClientConfig, skills: string): string {
  const { brand, audience, voice, constraints } = config.context;

  const clientContext = [
    'Client context:',
    `- Brand: ${brand}`,
    `- Audience: ${audience}`,
    `- Voice: ${voice}`,
    `- Constraints: ${constraints}`,
  ].join('\n');

  return [
    'You are a newsletter production assistant.',
    clientContext,
    'Editorial skills (use these to guide your work):',
    skills,
    'Execute skills in sequence following the orchestration skill.',
    'Adapt to the client\'s uploaded files and requests.',
    'Provide complete output with metadata and quality reports.',
  ].join('\n\n');
}
