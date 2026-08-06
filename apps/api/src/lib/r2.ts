/**
 * Cloudflare R2 Object Storage Client
 *
 * Bucket bersifat PRIVATE — tidak ada public URL.
 * Akses file hanya melalui presigned URL dengan TTL pendek (15 menit).
 *
 * Env vars yang dibutuhkan:
 *   R2_ACCOUNT_ID    — Cloudflare Account ID
 *   R2_ACCESS_KEY_ID — R2 API Token Access Key ID
 *   R2_SECRET_ACCESS_KEY — R2 API Token Secret Access Key
 *   R2_BUCKET_NAME   — Nama bucket R2
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured in environment variables');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME is not configured');
  return bucket;
}

/**
 * Generate unique R2 key untuk foto
 * Format: lampiran/{laporanId}/{timestamp}-{random}.bin
 * Extension .bin karena sudah dienkripsi (bukan file gambar biasa)
 */
export function generateR2Key(laporanId: string): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  return `lampiran/${laporanId}/${timestamp}-${random}.bin`;
}

/**
 * Upload Buffer terenkripsi ke R2
 * @param key - R2 object key (dari generateR2Key)
 * @param encryptedBuffer - Buffer yang sudah dienkripsi (AES-256-GCM)
 * @returns r2Key yang tersimpan
 */
export async function uploadEncryptedFile(
  key: string,
  encryptedBuffer: Buffer,
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: encryptedBuffer,
      ContentType: 'application/octet-stream', // Selalu octet-stream karena encrypted
      // Metadata untuk audit trail (tanpa identitas)
      Metadata: {
        'x-encrypted': 'aes-256-gcm',
        'x-uploaded-at': new Date().toISOString(),
      },
    }),
  );

  return key;
}

/**
 * Buat presigned URL untuk download file (15 menit TTL)
 * Hanya dipanggil saat MPK buka detail laporan.
 */
export async function getPresignedDownloadUrl(r2Key: string): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: r2Key,
  });

  return getSignedUrl(client, command, { expiresIn: 15 * 60 }); // 15 menit
}

/**
 * Hapus file dari R2 (saat laporan dihapus)
 */
export async function deleteFile(r2Key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: r2Key,
    }),
  );
}
