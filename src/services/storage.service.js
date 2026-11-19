import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

// File storage on Cloudflare R2 through its S3-compatible API.
const { r2 } = config;
const isConfigured = Boolean(r2.accessKeyId && r2.secretAccessKey && r2.bucket && r2.endpoint && r2.publicUrl);

let client;
const getClient = () => {
  if (!isConfigured) throw new AppError(503, 'File storage is not configured');
  client ??= new S3Client({
    region: 'auto',
    endpoint: r2.endpoint,
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
    // Only send/verify checksums when an operation requires them (keeps R2 compatible).
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return client;
};

export const publicUrlFor = (key) => `${r2.publicUrl}/${key}`;

// The object key behind one of our public URLs, or null for any other URL (e.g. an external avatar).
export const keyFromUrl = (url) =>
  isConfigured && typeof url === 'string' && url.startsWith(`${r2.publicUrl}/`) ? url.slice(r2.publicUrl.length + 1) : null;

export const uploadFile = async ({ key, body, contentType, cacheControl }) => {
  await getClient().send(
    new PutObjectCommand({ Bucket: r2.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }),
  );
  return { key, url: publicUrlFor(key) };
};

export const deleteFile = async (key) => {
  await getClient().send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }));
};

// Best-effort cleanup of a file we stored (old avatar etc.). Never fails the request.
export const deleteFileByUrl = async (url) => {
  const key = keyFromUrl(url);
  if (!key) return;
  try {
    await deleteFile(key);
  } catch (err) {
    console.warn(`[storage] could not delete ${key}: ${err.message}`);
  }
};
