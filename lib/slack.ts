import { BriefPayload } from '@/lib/brief-pdf';

function buildSlackSummary(brief: BriefPayload) {
  const benefits = brief.key_benefits.length
    ? `*Key benefits*\n${brief.key_benefits.map((item) => `• ${item}`).join('\n')}`
    : '*Key benefits*\n—';

  return [
    ':memo: *New brief submitted*',
    `*Name*: ${brief.name}`,
    `*Objective*: ${brief.objective}`,
    `*Audience*: ${brief.target_audience}`,
    `*Core message*: ${brief.core_message}`,
    `*Channels*: ${brief.channels.join(', ') || '—'}`,
    benefits,
  ].join('\n');
}

export async function sendSlackBrief({
  brief,
  pdfBuffer,
  filename,
}: {
  brief: BriefPayload;
  pdfBuffer: Buffer;
  filename: string;
}) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  if (!token || !channel) {
    return { success: false, error: 'Slack is not configured' };
  }

  try {
    const formData = new FormData();
    formData.append('channels', channel);
    formData.append('initial_comment', buildSlackSummary(brief));
    formData.append('filename', filename);
    formData.append('title', filename.replace('.pdf', ''));
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

    const response = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      return { success: false, error: data.error || 'Slack upload failed' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Slack upload failed' };
  }
}
