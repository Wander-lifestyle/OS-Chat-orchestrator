import { NextRequest, NextResponse } from 'next/server';
import {
  fetchBeehiivPostMetrics,
  getClientConfig,
  getRecentPerformanceMetrics,
  hasPerformanceRecord,
  listBeehiivPosts,
  storeLearningPattern,
  storePerformanceMetrics,
} from '@/app/lib/tool-runtime';
import { buildLearningSummary } from '@/app/lib/learning';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const clientId = params.get('clientId') || undefined;
    const workspaceId = params.get('workspaceId') || undefined;
    const track = params.get('track') || 'Newsletter';
    const limit = Math.min(Number(params.get('limit') || DEFAULT_LIMIT), 50);

    const analysisWindowHours = Number(process.env.LEARNING_ANALYSIS_WINDOW_HOURS || 48);
    const cutoff = Date.now() - analysisWindowHours * 60 * 60 * 1000;

    const clientConfig =
      clientId || workspaceId ? await getClientConfig({ clientId, workspaceId }) : null;

    const postsResult = await listBeehiivPosts(limit, clientConfig || undefined);
    if (!postsResult.success) {
      return NextResponse.json(
        { error: postsResult.error || 'Beehiiv list failed' },
        { status: 500 }
      );
    }

    const results: Array<{ postId: string; stored: boolean; error?: string }> = [];
    let processed = 0;

    for (const post of postsResult.posts) {
      if (!post?.id || !post?.sentAt) continue;

      const sentTime = new Date(post.sentAt).getTime();
      if (!Number.isFinite(sentTime) || sentTime > cutoff) continue;

      const existsResult = await hasPerformanceRecord(post.id, clientConfig || undefined);
      if (existsResult.success && existsResult.exists) {
        continue;
      }

      if (!existsResult.success && existsResult.error) {
        results.push({ postId: post.id, stored: false, error: existsResult.error });
        continue;
      }

      const metricsResult = await fetchBeehiivPostMetrics(post.id, clientConfig || undefined);
      const metrics = metricsResult.success ? metricsResult.metrics : undefined;

      const storeResult = await storePerformanceMetrics(
        {
          track,
          channel: 'Beehiiv',
          beehiivPostId: post.id,
          subjectLine: metrics?.subjectLine || post.title,
          sends: metrics?.sends ?? post.stats?.sends,
          opens: metrics?.opens ?? post.stats?.opens,
          clicks: metrics?.clicks ?? post.stats?.clicks,
          ctr: metrics?.ctr ?? post.stats?.ctr,
          unsubscribes: metrics?.unsubscribes ?? post.stats?.unsubscribes,
          sentAt: metrics?.sentAt || post.sentAt,
          ledgerUrl: metrics?.url || post.url,
          clientId,
          workspaceId,
        },
        clientConfig || undefined
      );

      results.push({
        postId: post.id,
        stored: storeResult.success,
        error: storeResult.success ? undefined : storeResult.error,
      });

      if (storeResult.success) {
        processed += 1;
      }
    }

    const historyResult = await getRecentPerformanceMetrics(
      track,
      clientConfig || undefined,
      10
    );

    let learningSummary = null;
    if (historyResult.success) {
      const learning = buildLearningSummary(historyResult.metrics);
      const learningStore = await storeLearningPattern(
        {
          track,
          summary: learning.summary,
          evidence: learning.evidence,
          applied: false,
        },
        clientConfig || undefined
      );

      learningSummary = {
        summary: learning.summary,
        evidence: learning.evidence,
        stored: learningStore.success,
        error: learningStore.success ? undefined : learningStore.error,
      };
    }

    return NextResponse.json({
      success: true,
      processed,
      results,
      learning: learningSummary,
    });
  } catch (error: any) {
    console.error('[Learning Cron Error]', error);
    return NextResponse.json(
      { error: error.message || 'Learning cron failed' },
      { status: 500 }
    );
  }
}
