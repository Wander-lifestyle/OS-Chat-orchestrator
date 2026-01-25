export type BeehiivScheduleInput = {
  subject: string;
  content?: string;
  sendAt?: string;
  audience?: string;
};

import { fetchWithTimeout } from '@/lib/http';

export type BeehiivScheduleResult = {
  id: string;
  status: string;
  summary: string;
  url?: string;
};

const BEEHIIV_BASE_URL =
  process.env.BEEHIIV_API_BASE_URL || 'https://api.beehiiv.com/v2';

export async function scheduleNewsletter(
  input: BeehiivScheduleInput
): Promise<BeehiivScheduleResult> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    throw new Error(
      'Beehiiv credentials are missing. Set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID.'
    );
  }

  const payload: Record<string, unknown> = {
    title: input.subject,
    content: input.content || '',
    email_subject_line: input.subject,
    status: input.sendAt ? 'scheduled' : 'draft',
  };

  if (input.sendAt) {
    payload.publish_date = input.sendAt;
  }

  if (input.audience) {
    payload.audience = input.audience;
  }

  const response = await fetchWithTimeout(
    `${BEEHIIV_BASE_URL}/publications/${publicationId}/posts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Beehiiv API error (${response.status}): ${errorText || 'Unknown error.'}`
    );
  }

  const data = await response.json();
  const post = data?.data ?? data;

  return {
    id: post?.id || `beehiiv-${Date.now()}`,
    status: payload.status as string,
    url: post?.web_url || post?.url,
    summary: `Beehiiv post "${input.subject}" created (${payload.status}).`,
  };
}
