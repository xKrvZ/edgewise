'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userAvatarUrl, userDisplayName, userInitials } from '@/lib/user-display';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

export function UserAvatar({
  displayName,
  name,
  email,
  image,
  avatarUrl,
  className,
  fallbackClassName,
  alt,
}: UserAvatarProps) {
  const fields = { displayName, name, email };
  const label = userDisplayName(fields);
  const src = userAvatarUrl({ image, avatarUrl });

  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={alt ?? label} />
      <AvatarFallback className={cn(fallbackClassName)}>
        {userInitials(fields)}
      </AvatarFallback>
    </Avatar>
  );
}
