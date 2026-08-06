/**
 * Supabase Storage Client
 *
 * Bucket bersifat PRIVATE — foto terenkripsi diupload ke Supabase Storage.
 * Akses file hanya melalui presigned URL (Signed URL) dengan durasi terbatas (15 menit).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function getBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? 'si-aparat-lampiran';
}

/**
 * Generate key unik untuk foto
 * Format: lampiran/{laporanId}/{timestamp}-{random}.bin
 */
export function generateStorageKey(laporanId: string): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  return `lampiran/${laporanId}/${timestamp}-${random}.bin`;
}

/**
 * Upload Buffer terenkripsi ke Supabase Storage
 */
export async function uploadEncryptedFile(
  key: string,
  encryptedBuffer: Buffer,
): Promise<string> {
  const supabase = getSupabaseClient();
  const bucket = getBucketName();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, encryptedBuffer, {
      contentType: 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
  }

  return key;
}

/**
 * Buat presigned URL (Signed URL) untuk download file (15 menit TTL)
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const supabase = getSupabaseClient();
  const bucket = getBucketName();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, 15 * 60); // 15 menit

  if (error || !data) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Hapus file dari Supabase Storage
 */
export async function deleteFile(key: string): Promise<void> {
  const supabase = getSupabaseClient();
  const bucket = getBucketName();

  const { error } = await supabase.storage.from(bucket).remove([key]);

  if (error) {
    throw new Error(`Failed to delete file from Supabase Storage: ${error.message}`);
  }
}
