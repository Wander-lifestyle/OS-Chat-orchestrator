import { NextResponse } from 'next/server';
import { renderBriefPdf, BriefPayload } from '@/lib/brief-pdf';
import { sendSlackBrief } from '@/lib/slack';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const {
    name,
    objective,
    target_audience,
    core_message,
    key_benefits,
    channels,
  } = body || {};

  if (!name || !objective || !target_audience || !core_message) {
    return NextResponse.json(
      { error: 'name, objective, target_audience, and core_message are required' },
      { status: 400 }
    );
  }

  try {
    const brief: BriefPayload = {
      name,
      objective,
      target_audience,
      core_message,
      key_benefits: Array.isArray(key_benefits)
        ? key_benefits.filter(Boolean)
        : [],
      channels: Array.isArray(channels) ? channels.filter(Boolean) : [],
    };

    const pdfBuffer = await renderBriefPdf(brief);
    const fileName = `${name}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'light-brief';
    const filename = `${fileName}-brief.pdf`;

    const slackResult = await sendSlackBrief({
      brief,
      pdfBuffer,
      filename,
    });

    return NextResponse.json({
      success: true,
      file_name: filename,
      pdf_base64: pdfBuffer.toString('base64'),
      slack: slackResult,
    });
  } catch (error) {
    console.error('Brief creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create brief' },
      { status: 500 }
    );
  }
}
