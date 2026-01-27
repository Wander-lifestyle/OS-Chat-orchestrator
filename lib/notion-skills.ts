import { getPropertyText, getPropertyTextArray, notionFetch } from '@/lib/notion';

export type SkillRecord = {
  id: string;
  name: string;
  type: string;
  trigger: string;
  inputsRequired: string;
  instructions: string;
  outputConstraints: string;
  requiresTools: string[];
};

const NAME_FIELD = process.env.NOTION_SKILLS_NAME_FIELD || 'Skill Name';
const TYPE_FIELD = process.env.NOTION_SKILLS_TYPE_FIELD || 'Skill Type';
const TRIGGER_FIELD = process.env.NOTION_SKILLS_TRIGGER_FIELD || 'Trigger Condition';
const INPUTS_FIELD = process.env.NOTION_SKILLS_INPUTS_FIELD || 'Inputs Required';
const INSTRUCTIONS_FIELD =
  process.env.NOTION_SKILLS_INSTRUCTIONS_FIELD || 'Skill Instructions';
const OUTPUT_FIELD =
  process.env.NOTION_SKILLS_OUTPUT_FIELD || 'Output Constraints';
const REQUIRES_FIELD =
  process.env.NOTION_SKILLS_REQUIRES_FIELD || 'Requires Tools';
const STATUS_FIELD = process.env.NOTION_SKILLS_STATUS_FIELD || 'Status';
const STATUS_VALUE =
  process.env.NOTION_SKILLS_STATUS_ACTIVE_VALUE || 'Active';
const STATUS_TYPE = process.env.NOTION_SKILLS_STATUS_TYPE || 'status';

export const fetchSkills = async (skillsDbId?: string) => {
  if (!skillsDbId) {
    throw new Error('Skills database is missing for this client.');
  }

  const filter =
    STATUS_FIELD && STATUS_VALUE
      ? {
          property: STATUS_FIELD,
          [STATUS_TYPE === 'select' ? 'select' : 'status']: {
            equals: STATUS_VALUE,
          },
        }
      : undefined;

  const data = await notionFetch(`/databases/${skillsDbId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter,
      page_size: 100,
    }),
  });

  return (data.results || []).map((item: any) => {
    const properties = item.properties || {};

    return {
      id: item.id,
      name: getPropertyText(properties, NAME_FIELD),
      type: getPropertyText(properties, TYPE_FIELD),
      trigger: getPropertyText(properties, TRIGGER_FIELD),
      inputsRequired: getPropertyText(properties, INPUTS_FIELD),
      instructions: getPropertyText(properties, INSTRUCTIONS_FIELD),
      outputConstraints: getPropertyText(properties, OUTPUT_FIELD),
      requiresTools: getPropertyTextArray(properties, REQUIRES_FIELD),
    } as SkillRecord;
  });
};
