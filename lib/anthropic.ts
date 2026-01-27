import Anthropic from '@anthropic-ai/sdk';

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
export const DEFAULT_MAX_TOKENS = parseNumber(
  process.env.ANTHROPIC_MAX_TOKENS,
  900
);
export const DEFAULT_TEMPERATURE = parseNumber(
  process.env.ANTHROPIC_TEMPERATURE,
  0.2
);

export const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set.');
  }

  return new Anthropic({ apiKey });
};
