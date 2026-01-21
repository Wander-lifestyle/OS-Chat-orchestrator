// ============================================
// EXISTING SCHEMA TYPES (OS Ledger)
// ============================================

export interface Campaign {
  ledger_id: string;
  project_name: string;
  brief_id: string | null;
  status: string;
  owner_name: string | null;
  channels: string[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

// ============================================
// NEW SCHEMA TYPES (Editorial OS Extension)
// ============================================

export interface Brief {
  id: string;
  brief_id: string;
  name: string;
  objective: string;
  target_audience: string;
  core_message: string;
  key_benefits: string[] | null;
  channels: string[];
  success_metrics: Record<string, unknown> | null;
  timeline: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterDraft {
  id: string;
  brief_uuid: string | null;
  ledger_id: string | null;
  subject_line: string;
  preview_text: string | null;
  body_html: string;
  body_text: string | null;
  recommended_send_time: string | null;
  beehiiv_post_id: string | null;
  status: string;
  performance_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// TOOL INPUT TYPES
// ============================================

export interface CreateBriefInput {
  name: string;
  objective: string;
  target_audience: string;
  core_message: string;
  key_benefits?: string[];
  channels?: string[];
  ledger_id?: string;
  owner_name?: string;
}

export interface SearchAssetsInput {
  query: string;
  tags?: string[];
  limit?: number;
}

export interface CreateNewsletterInput {
  brief_uuid?: string;
  ledger_id?: string;
  subject_line: string;
  preview_text?: string;
  body_html: string;
  body_text?: string;
  recommended_send_time?: string;
}

export interface ScheduleBeehiivInput {
  draft_id: string;
  send_at: string;
}

export interface NotifySlackInput {
  message: string;
  channel?: string;
}

export interface UpdateCampaignInput {
  ledger_id: string;
  brief_id?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// TOOL RESULT TYPES
// ============================================

export interface BriefResult {
  brief_id: string;
  uuid: string;
  status: string;
  name: string;
  ledger_id?: string;
}

export interface AssetResult {
  assets: Array<{
    id: string;
    url: string;
    tags: string[];
    width: number;
    height: number;
  }>;
  source: 'cloudinary' | 'sample';
}

export interface NewsletterDraftResult {
  draft_id: string;
  status: string;
  ledger_id?: string;
}

export interface BeehiivResult {
  beehiiv_id: string;
  edit_url: string;
  scheduled_at: string;
}

export interface SlackResult {
  sent: boolean;
}

export interface CampaignResult {
  ledger_id: string;
  status: string;
  updated: boolean;
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
