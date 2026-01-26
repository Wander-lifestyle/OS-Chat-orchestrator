import { CampaignDetails } from './brief';

export interface NewsletterDraft {
  subject: string;
  previewText: string;
  body: string;
}

export interface SocialDrafts {
  posts: string[];
}

export function generateNewsletterDraft(
  details: CampaignDetails
): NewsletterDraft {
  const subject = `${details.name}: a faster way to stay connected`;
  const previewText = `Launching now in ${details.region || 'Global'} - see what is new.`;
  const body = [
    `Hi there,`,
    ``,
    `We are excited to introduce ${details.name}. It is designed for ${details.audience || 'busy teams'} who want a simpler, faster way to get connected.`,
    ``,
    `What you get:`,
    `- Simple setup with clear pricing`,
    `- Reliable coverage across key markets`,
    `- Support built for real people, not ticket queues`,
    ``,
    `If you want to launch a campaign that actually ships, ${details.name} is built for that.`,
    ``,
    `Reply with questions or hit approve to schedule.`,
    ``,
    `- Editorial OS`,
  ].join('\n');

  return { subject, previewText, body };
}

export function generateSocialDrafts(details: CampaignDetails): SocialDrafts {
  const base = `${details.name} is here. Faster setup, clearer pricing, built for ${details.audience || 'real customers'}.`;
  const posts = [
    `${base} Launching now in ${details.region || 'Global'}.`,
    `Planning a launch? ${details.name} gives you the speed and reliability you want. #launch #marketing`,
    `Stop wrestling with tools. ${details.name} keeps it simple so you can ship.`
  ];

  return { posts };
}
