import fs from 'fs';
import path from 'path';

export async function loadAgentSpec(agentName: string): Promise<string> {
  const agentPath = path.join(process.cwd(), 'agents', `${agentName}.md`);

  if (!fs.existsSync(agentPath)) {
    throw new Error(`Agent spec not found: ${agentName}`);
  }

  return fs.readFileSync(agentPath, 'utf-8');
}

export async function loadMultipleAgentSpecs(agentNames: string[]): Promise<string> {
  const specs = await Promise.all(agentNames.map(loadAgentSpec));
  return specs.join('\n\n---\n\n');
}
