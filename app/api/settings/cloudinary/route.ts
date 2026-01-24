import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';

type CloudinarySettingsPayload = {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
};

function maskValue(value: string) {
  if (!value) return '';
  if (value.length <= 6) return `${value.slice(0, 2)}•••`;
  return `${value.slice(0, 4)}•••${value.slice(-2)}`;
}

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ error: 'Workspace required.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('organization_cloudinary')
    .select('cloud_name, api_key, folder')
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ connected: false });
    }
    console.error('Cloudinary settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }

  return NextResponse.json({
    connected: true,
    cloudName: data.cloud_name,
    apiKey: maskValue(data.api_key),
    folder: data.folder ?? '',
  });
}

export async function POST(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ error: 'Workspace required.' }, { status: 403 });
  }

  const payload = (await request.json()) as CloudinarySettingsPayload;
  const cloudName = payload.cloudName?.trim();
  const apiKey = payload.apiKey?.trim();
  const apiSecret = payload.apiSecret?.trim();
  const folder = payload.folder?.trim() || null;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloud name, API key, and API secret are required.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('organization_cloudinary')
    .upsert(
      {
        org_id: orgId,
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        folder,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id' },
    );

  if (error) {
    console.error('Cloudinary settings update error:', error);
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
