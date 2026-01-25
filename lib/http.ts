const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const DEFAULT_TOOL_TIMEOUT_MS = parseNumber(
  process.env.EDITORIAL_OS_TOOL_TIMEOUT_MS,
  15000
);

export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TOOL_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};
