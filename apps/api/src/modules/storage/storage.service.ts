import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'node:path';
import { nanoid } from 'nanoid';
import { S3_CLIENT, type MediaKind } from './constants/storage.constants';

/**
 * Thin wrapper over an S3-compatible store (MinIO locally). Owns object-key
 * generation and presigned URL minting so feature modules never touch the SDK.
 * Uploads/downloads go DIRECTLY browser <-> object store via short-lived
 * presigned URLs; large media (videos) never streams through the API process.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly uploadExpiry: number;
  private readonly downloadExpiry: number;

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    config: ConfigService,
  ) {
    this.bucket = config.get<string>('s3.bucket') as string;
    this.uploadExpiry = config.get<number>('s3.uploadExpiry') as number;
    this.downloadExpiry = config.get<number>('s3.downloadExpiry') as number;
  }

  /** Best-effort: ensure the bucket exists so a fresh MinIO volume just works. */
  async onModuleInit(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created storage bucket "${this.bucket}"`);
      } catch (error) {
        this.logger.warn(
          `Could not verify/create bucket "${this.bucket}"; uploads may fail until it exists`,
          error as Error,
        );
      }
    }
  }

  /**
   * Generates a collision-free object key scoped to the owner and media kind,
   * preserving the original file extension for correct content sniffing.
   */
  buildKey(userId: string, kind: MediaKind, filename: string): string {
    const ext = extname(filename).toLowerCase().slice(0, 12);
    return `${kind}s/${userId}/${nanoid()}${ext}`;
  }

  /** Profile avatar or header banner object key. */
  buildProfileKey(
    userId: string,
    asset: 'avatar' | 'header',
    filename: string,
  ): string {
    const folder = asset === 'avatar' ? 'avatars' : 'headers';
    const ext = extname(filename).toLowerCase().slice(0, 12);
    return `${folder}/${userId}/${nanoid()}${ext}`;
  }

  /** Community logo or header banner object key. */
  buildCommunityKey(
    communityId: string,
    asset: 'logo' | 'header',
    filename: string,
  ): string {
    const folder = asset === 'logo' ? 'community-logos' : 'community-headers';
    const ext = extname(filename).toLowerCase().slice(0, 12);
    return `${folder}/${communityId}/${nanoid()}${ext}`;
  }

  /** Community blog post hero header or inline content image object key. */
  buildCommunityPostKey(
    communityId: string,
    asset: 'header' | 'content',
    filename: string,
  ): string {
    const folder =
      asset === 'header' ? 'community-post-headers' : 'community-post-content';
    const ext = extname(filename).toLowerCase().slice(0, 12);
    return `${folder}/${communityId}/${nanoid()}${ext}`;
  }

  /** Short-lived PUT URL the browser uploads the file bytes to directly. */
  async presignUpload(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: this.uploadExpiry },
    );
  }

  /** Short-lived GET URL for displaying a private object in the browser. */
  async presignDownload(key: string): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.downloadExpiry },
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  get uploadExpirySeconds(): number {
    return this.uploadExpiry;
  }
}
