import { createBrief } from './brief';
import { searchAssets } from './cloudinary';
import { createNewsletter } from './newsletter';
import { scheduleBeehiiv } from './beehiiv';
import { notifySlack } from './slack';
import { updateCampaign } from './ledger';

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'create_brief':
      return createBrief(input as any);
    case 'search_assets':
      return searchAssets(input as any);
    case 'create_newsletter':
      return createNewsletter(input as any);
    case 'schedule_beehiiv':
      return scheduleBeehiiv(input as any);
    case 'notify_slack':
      return notifySlack(input as any);
    case 'update_campaign':
      return updateCampaign(input as any);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
