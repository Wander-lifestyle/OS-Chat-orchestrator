export type SlackNotificationInput = {
  channel: string;
  message: string;
};

export type SlackNotificationResult = {
  id: string;
  status: string;
  summary: string;
};

export async function postNotification(
  input: SlackNotificationInput
): Promise<SlackNotificationResult> {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    return {
      id: 'slack-unconfigured',
      status: 'not_configured',
      summary: 'Slack token is missing. Set SLACK_BOT_TOKEN.',
    };
  }

  // TODO: Implement Slack API call. For now, return a stubbed response.
  return {
    id: `slack-${Date.now()}`,
    status: 'queued',
    summary: `Slack notification queued for ${input.channel}.`,
  };
}
