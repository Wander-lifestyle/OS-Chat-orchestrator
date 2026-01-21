import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { CreateNewsletterInput, NewsletterDraftResult } from '@/types';

export async function createNewsletter(
  input: CreateNewsletterInput
): Promise<NewsletterDraftResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('newsletter_drafts')
    .insert({
      brief_uuid: input.brief_uuid || null,
      ledger_id: input.ledger_id || null,
      subject_line: input.subject_line,
      preview_text: input.preview_text || null,
      body_html: input.body_html,
      body_text: input.body_text || null,
      recommended_send_time: input.recommended_send_time || null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create newsletter draft: ${error?.message || 'Unknown error'}`
    );
  }

  return {
    draft_id: data.id,
    status: 'draft',
    ledger_id: input.ledger_id,
  };
}
