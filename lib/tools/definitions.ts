import Anthropic from '@anthropic-ai/sdk';

export const tools: Anthropic.Tool[] = [
  {
    name: 'create_brief',
    description:
      'Save a campaign brief to the database and link it to the Ledger.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        objective: { type: 'string', description: 'Primary objective' },
        target_audience: { type: 'string', description: 'Target audience' },
        core_message: { type: 'string', description: 'Core message' },
        key_benefits: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key benefit bullets',
        },
        channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Channels for the campaign',
        },
        ledger_id: {
          type: 'string',
          description: 'Optional: link to existing Ledger ID',
        },
        owner_name: {
          type: 'string',
          description: 'Optional: campaign owner name',
        },
      },
      required: ['name', 'objective', 'target_audience', 'core_message'],
    },
  },
  {
    name: 'search_assets',
    description:
      'Search Cloudinary for assets matching the campaign needs.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags to filter',
        },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_newsletter',
    description:
      'Save a newsletter draft to the database for review and scheduling.',
    input_schema: {
      type: 'object',
      properties: {
        brief_uuid: {
          type: 'string',
          description: 'UUID of the brief (not BRF text id)',
        },
        ledger_id: {
          type: 'string',
          description: 'Ledger ID (LED-xxx)',
        },
        subject_line: { type: 'string', description: 'Email subject line' },
        preview_text: { type: 'string', description: 'Preview text' },
        body_html: { type: 'string', description: 'HTML body' },
        body_text: { type: 'string', description: 'Plain text body' },
        recommended_send_time: {
          type: 'string',
          description: 'ISO timestamp for recommended send',
        },
      },
      required: ['subject_line', 'body_html'],
    },
  },
  {
    name: 'schedule_beehiiv',
    description: 'Schedule a Beehiiv post for sending.',
    input_schema: {
      type: 'object',
      properties: {
        draft_id: {
          type: 'string',
          description: 'Newsletter draft UUID',
        },
        send_at: { type: 'string', description: 'ISO send time' },
      },
      required: ['draft_id', 'send_at'],
    },
  },
  {
    name: 'notify_slack',
    description: 'Send a Slack notification for major actions.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to send' },
        channel: { type: 'string', description: 'Channel (optional)' },
      },
      required: ['message'],
    },
  },
  {
    name: 'update_campaign',
    description: 'Update an existing campaign in the Ledger.',
    input_schema: {
      type: 'object',
      properties: {
        ledger_id: { type: 'string', description: 'LED-xxx' },
        brief_id: { type: 'string', description: 'BRF-xxx' },
        status: { type: 'string', description: 'Campaign status' },
        metadata: {
          type: 'object',
          description: 'Metadata to merge into the campaign',
        },
      },
      required: ['ledger_id'],
    },
  },
];
