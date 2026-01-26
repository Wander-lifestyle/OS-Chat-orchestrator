export interface PerformanceMetric {
  subjectLine?: string;
  sends?: number;
  opens?: number;
  clicks?: number;
  ctr?: number;
  unsubscribes?: number;
  sentAt?: string;
  collectedAt?: string;
}

function safeRate(numerator?: number, denominator?: number) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') return null;
  if (denominator <= 0) return null;
  return numerator / denominator;
}

export function buildLearningSummary(metrics: PerformanceMetric[]) {
  if (!metrics || metrics.length === 0) {
    return {
      summary: 'Placeholder: No performance data yet.',
      evidence: 'Run the learning cron after newsletters have been sent.',
    };
  }

  if (metrics.length < 2) {
    return {
      summary: 'Placeholder: Not enough history to learn yet.',
      evidence: 'Collect at least two sends to compare performance.',
    };
  }

  const [latest, ...history] = metrics;
  const latestOpenRate = safeRate(latest.opens, latest.sends);
  const baselineRates = history
    .map((item) => safeRate(item.opens, item.sends))
    .filter((rate): rate is number => typeof rate === 'number');

  const baselineAverage =
    baselineRates.length > 0
      ? baselineRates.reduce((sum, value) => sum + value, 0) / baselineRates.length
      : null;

  const isQuestionSubject = Boolean(latest.subjectLine && latest.subjectLine.includes('?'));

  if (latestOpenRate !== null && baselineAverage !== null && isQuestionSubject) {
    const delta = ((latestOpenRate - baselineAverage) / baselineAverage) * 100;
    const direction = delta >= 0 ? 'higher' : 'lower';
    return {
      summary: `Question subject lines are ${Math.abs(delta).toFixed(1)}% ${direction} than baseline.`,
      evidence: `Latest open rate ${(latestOpenRate * 100).toFixed(1)}% vs baseline ${(
        baselineAverage * 100
      ).toFixed(1)}% across ${baselineRates.length} sends.`,
    };
  }

  return {
    summary: 'Placeholder: Collect more sends to detect reliable patterns.',
    evidence:
      'Track open rate, click rate, and subject style to build consistent learnings.',
  };
}
