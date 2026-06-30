import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Expose } from 'class-transformer';

import type { PostWithAuthorProfile } from '../daos/community-post.dao';

import {

  isLikelyHtmlContent,

  stripHtmlToPlainText,

} from '../utils/community-post-content.util';

import type { CommunityPostVisibility } from '../constants/community.constants';



const EXCERPT_MAX_LENGTH = 200;



export class CommunityPostSummaryDto {

  @Expose()

  @ApiProperty()

  id: string;



  @Expose()

  @ApiProperty()

  communityId: string;



  @Expose()

  @ApiProperty()

  authorUserId: string;



  @Expose()

  @ApiProperty()

  authorDisplayName: string;



  @Expose()

  @ApiProperty({ nullable: true })

  authorAvatarUrl: string | null;



  @Expose()

  @ApiProperty({ example: 'Weekly market recap' })

  title: string;



  @Expose()

  @ApiProperty({ description: 'Plain-text excerpt of the post body' })

  excerpt: string;



  @Expose()

  @ApiProperty({ enum: ['public', 'private'] })

  visibility: CommunityPostVisibility;



  @Expose()

  @ApiProperty()

  commentsEnabled: boolean;



  @Expose()

  @ApiProperty({ type: String, format: 'date-time' })

  publishedAt: Date;



  @Expose()

  @ApiProperty({ type: String, format: 'date-time' })

  createdAt: Date;



  @Expose()

  @ApiProperty({ type: String, format: 'date-time' })

  updatedAt: Date;



  @Expose()

  @ApiPropertyOptional({ nullable: true, description: 'Presigned URL for the post hero image' })

  headerUrl?: string | null;



  @Expose()

  @ApiProperty({ description: 'Whether the post has been soft-deleted' })

  isDeleted: boolean;



  @Expose()

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })

  deletedAt?: Date | null;

}



export class CommunityPostDetailDto extends CommunityPostSummaryDto {

  @Expose()

  @ApiProperty({ description: 'Full post body as HTML (legacy plain-text posts are returned as-is)' })

  content: string;

}



export class PublicCommunityPostDetailDto extends CommunityPostDetailDto {

  @Expose()

  @ApiProperty({ description: 'Community name for public share pages' })

  communityName: string;

}



function createExcerpt(content: string): string {

  const plain = isLikelyHtmlContent(content) ? stripHtmlToPlainText(content) : content;

  const normalized = plain.replace(/\s+/g, ' ').trim();

  if (normalized.length <= EXCERPT_MAX_LENGTH) {

    return normalized;

  }

  return `${normalized.slice(0, EXCERPT_MAX_LENGTH).trimEnd()}…`;

}



export function toCommunityPostSummaryDto(

  row: PostWithAuthorProfile,

  authorAvatarUrl: string | null,

  authorDisplayName: string,

  headerUrl: string | null = null,

): CommunityPostSummaryDto {

  const isDeleted = row.deletedAt != null;

  return {

    id: row.id,

    communityId: row.communityId,

    authorUserId: row.authorUserId,

    authorDisplayName,

    authorAvatarUrl,

    title: row.title,

    excerpt: isDeleted ? '' : createExcerpt(row.content),

    visibility: row.visibility as CommunityPostVisibility,

    commentsEnabled: row.commentsEnabled,

    publishedAt: row.publishedAt,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,

    headerUrl: isDeleted ? null : headerUrl,

    isDeleted,

    deletedAt: row.deletedAt ?? null,

  };

}



export function toCommunityPostDetailDto(

  row: PostWithAuthorProfile,

  authorAvatarUrl: string | null,

  authorDisplayName: string,

  content: string,

  headerUrl: string | null,

): CommunityPostDetailDto {

  const isDeleted = row.deletedAt != null;

  return {

    ...toCommunityPostSummaryDto(row, authorAvatarUrl, authorDisplayName, headerUrl),

    content: isDeleted ? '' : content,

    headerUrl: isDeleted ? null : headerUrl,

  };

}

