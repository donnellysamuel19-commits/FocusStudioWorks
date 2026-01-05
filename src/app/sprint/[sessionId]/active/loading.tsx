'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <Skeleton className="h-10 w-3/4 mb-4" />
      <Skeleton className="h-6 w-1/2 mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
