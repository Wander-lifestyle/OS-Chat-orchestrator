export async function postSlackMessage({
  token,
  channel,
  text,
}: {
  token: string;
  channel: string;
  text: string;
}) {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!response.ok || !data.ok) {
      return { success: false, error: data.error || `Slack error ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Slack request failed' };
  }
}
