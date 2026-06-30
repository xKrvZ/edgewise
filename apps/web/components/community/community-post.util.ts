export function wasPostUpdated(publishedAt: string, updatedAt: string): boolean {
  try {
    return new Date(updatedAt).getTime() > new Date(publishedAt).getTime();
  } catch {
    return false;
  }
}
