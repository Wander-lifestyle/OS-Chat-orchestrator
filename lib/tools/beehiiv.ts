import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';
import { BeehiivResult, ScheduleBeehiivInput } from '@/types/index';

const BEEHIIV_API = 'https://api.beehiiv.com/v2';

export async function scheduleBeehiiv(
  input: ScheduleBeehiivInput
): Promise<BeehiivResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  if (!process.env.BEEHIIV_API_KEY || !process.env.BEEHIIV_PUBLICATION_ID) {
    throw new Error('Beehiiv is not configured');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: draft, error: fetchError } = await supabase
    .from('newsletter_drafts')
    .select('*')
    .eq('id', input.draft_id)
    .single();

  if (fetchError || !draft) {
    throw new Error(`Draft not found: ${input.draft_id}`);
  }

  const response = await fetch(
    `${BEEHIIV_API}/publications/${process.env.BEEHIIV_PUBLICATION_ID}/posts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: draft.subject_line,
        subtitle: draft.preview_text || '',
        content: draft.body_html,
        status: 'scheduled',
        scheduled_at: input.send_at,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Beehiiv API error:', errorText);
    throw new Error(`Beehiiv API error: ${response.status}`);
  }

  const result = await response.json();
  const beehiivId = result?.data?.id;
  const editUrl =
    result?.data?.url || (beehiivId ? `https://app.beehiiv.com/posts/${beehiivId}` : '');

  await supabase
    .from('newsletter_drafts')
    .update({
      beehiiv_post_id: beehiivId,
      status: 'scheduled',
      recommended_send_time: input.send_at,
    })
    .eq('id', input.draft_id);

  if (draft.ledger_id) {
    await supabase
      .from('campaigns')
      .update({
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('ledger_id', draft.ledger_id);
  }

  return {
    beehiiv_id: beehiivId,
    edit_url: editUrl,
    scheduled_at: input.send_at,
  };
}
