export type SlackNotificationInput = {
  channel: string;
  message: string;
};

import { fetchWithTimeout } from '@/lib/http';

export type SlackNotificationResult = {
  id: string;
  status: string;
  summary: string;
  channel?: string;
};

export async function postNotification(
  input: SlackNotificationInput
): Promise<SlackNotificationResult> {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    throw new Error('Slack token is missing. Set SLACK_BOT_TOKEN.');
  }

  const response = await fetchWithTimeout(
    'https://slack.com/api/chat.postMessage',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: input.channel,
        text: input.message,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Slack API error (${response.status}): ${errorText || 'Unknown error.'}`
    );
  }

  const data = await response.json();

  if (!data?.ok) {
    throw new Error(`Slack API error: ${data?.error || 'Unknown error.'}`);
  }

  return {
    id: data.ts || `slack-${Date.now()}`,
    status: 'sent',
    channel: data.channel,
    summary: `Slack notification sent to ${input.channel}.`,
  };
}
