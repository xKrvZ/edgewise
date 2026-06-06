/**
 * S3-compatible object storage (MinIO locally, AWS S3 / R2 / etc. in prod).
 *
 * `endpoint` is used both for SDK calls AND for signing presigned URLs, so it
 * MUST be reachable from the browser that performs the upload/download. In local
 * dev the API and the browser both run on the host, so `http://localhost:9000`
 * works for both. `forcePathStyle` is required for MinIO (and most non-AWS S3s).
 */
export default {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minio',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'password',
  bucket: process.env.S3_BUCKET || 'platform',
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
  // Presigned URL lifetimes (seconds).
  uploadExpiry: parseInt(process.env.S3_UPLOAD_EXPIRY || '900', 10) || 900,
  downloadExpiry: parseInt(process.env.S3_DOWNLOAD_EXPIRY || '3600', 10) || 3600,
};
