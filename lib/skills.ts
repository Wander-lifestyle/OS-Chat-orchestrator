import 'server-only';

import fs from 'fs';
import path from 'path';

const NEWSLETTER_SKILL_FILES = [
  'evergreen-01-newsletter-orchestration.md',
  'evergreen-02-content-sourcing.md',
  'evergreen-03-audience-lens.md',
  'evergreen-04-brand-voice.md',
  'evergreen-05-newsletter-structure.md',
  'evergreen-06-subject-line-craft.md',
  'evergreen-07-content-prioritization.md',
  'evergreen-08-newsletter-format.md',
  'evergreen-09-engagement-closure.md',
  'evergreen-10-send-time-optimization.md',
  'evergreen-11-subscriber-segmentation.md',
  'evergreen-12-campaign-sequence.md',
  'evergreen-13-conflict-resolver.md',
  'evergreen-14-quality-control.md',
  'evergreen-15-performance-learning.md',
];

export function loadNewsletterSkills(): string {
  const skillsDir = path.join(process.cwd(), 'skills', 'newsletter');

  return NEWSLETTER_SKILL_FILES.map((file) =>
    fs.readFileSync(path.join(skillsDir, file), 'utf-8')
  ).join('\n\n---\n\n');
}
