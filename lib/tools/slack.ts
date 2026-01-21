import { NotifySlackInput, SlackResult } from '@/types';

export async function notifySlack(
  input: NotifySlackInput
): Promise<SlackResult> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return { sent: false };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.message,
      }),
    });

    return { sent: response.ok };
  } catch (error) {
    console.error('Slack notification failed:', error);
    return { sent: false };
  }
}
