import fs from 'fs/promises';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'lib', 'prompts');

export async function loadPrompts(agents: string[]): Promise<string> {
  const prompts = await Promise.all(
    agents.map(async (agent) => {
      const filePath = path.join(PROMPTS_DIR, `${agent}.md`);
      try {
        return await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        console.error(`Failed to load agent prompt: ${agent}`, error);
        return '';
      }
    })
  );

  return prompts.filter(Boolean).join('\n\n---\n\n');
}

export async function loadAllPrompts(): Promise<string> {
  return loadPrompts([
    'claude',
    'brief-specialist',
    'newsletter-agent',
    'dam-agent',
    'social-engine',
  ]);
}
