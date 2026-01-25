export type BeehiivScheduleInput = {
  subject: string;
  content?: string;
  sendAt?: string;
  audience?: string;
};

export type BeehiivScheduleResult = {
  id: string;
  status: string;
  summary: string;
};

export async function scheduleNewsletter(
  input: BeehiivScheduleInput
): Promise<BeehiivScheduleResult> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    return {
      id: 'beehiiv-unconfigured',
      status: 'not_configured',
      summary:
        'Beehiiv credentials are missing. Set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID.',
    };
  }

  // TODO: Implement Beehiiv API call. For now, return a stubbed response.
  return {
    id: `beehiiv-${Date.now()}`,
    status: 'scheduled',
    summary: `Newsletter "${input.subject}" queued for Beehiiv.`,
  };
}
