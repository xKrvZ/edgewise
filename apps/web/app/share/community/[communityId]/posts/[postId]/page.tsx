import { PublicCommunityPostPageClient } from '@/components/share/public-community-post-page-client';
import {
  fetchPublicCommunityPost,
  PublicApiError,
} from '@/lib/public-api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ communityId: string; postId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { communityId, postId } = await params;
  try {
    const post = await fetchPublicCommunityPost(communityId, postId);
    if (post.isDeleted) {
      return {
        title: `Deleted article — ${post.communityName}`,
        description: 'This community article is no longer available.',
        robots: 'noindex,nofollow',
      };
    }
    return {
      title: `${post.title} — ${post.communityName}`,
      description: post.excerpt,
      robots: 'index,follow',
    };
  } catch {
    return { title: 'Community post — Edgewise' };
  }
}

export default async function SharedCommunityPostPage({ params }: PageProps) {
  const { communityId, postId } = await params;

  try {
    const post = await fetchPublicCommunityPost(communityId, postId);
    return <PublicCommunityPostPageClient post={post} communityId={communityId} />;
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
