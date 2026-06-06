import { S3Client } from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3_CLIENT } from './constants/storage.constants';
import { StorageService } from './storage.service';

/**
 * Global so any feature module (screenshots, future exports, etc.) can inject
 * {@link StorageService} without re-importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3_CLIENT,
      useFactory: (config: ConfigService) =>
        new S3Client({
          endpoint: config.get<string>('s3.endpoint'),
          region: config.get<string>('s3.region'),
          forcePathStyle: config.get<boolean>('s3.forcePathStyle'),
          credentials: {
            accessKeyId: config.get<string>('s3.accessKeyId') as string,
            secretAccessKey: config.get<string>(
              's3.secretAccessKey',
            ) as string,
          },
        }),
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
