import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'public-booking';

/**
 * Upload a single file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  supabase: SupabaseClient,
  folder: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
