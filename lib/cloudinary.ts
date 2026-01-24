import { v2 as cloudinary } from 'cloudinary';
import { getSupabaseAdmin } from './supabase';

export type CloudinarySettings = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string | null;
};

type CloudinaryRow = {
  org_id: string;
  cloud_name: string;
  api_key: string;
  api_secret: string;
  folder: string | null;
};

export async function getCloudinarySettingsForOrg(orgId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('organization_cloudinary')
    .select('org_id, cloud_name, api_key, api_secret, folder')
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  const row = data as CloudinaryRow;
  return {
    cloudName: row.cloud_name,
    apiKey: row.api_key,
    apiSecret: row.api_secret,
    folder: row.folder,
  } satisfies CloudinarySettings;
}

export function configureCloudinary(settings: CloudinarySettings) {
  cloudinary.config({
    cloud_name: settings.cloudName,
    api_key: settings.apiKey,
    api_secret: settings.apiSecret,
    secure: true,
  });
}
