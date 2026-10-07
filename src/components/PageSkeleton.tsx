import { Skeleton } from "@/components/ui/skeleton";

export const PageSkeleton = () => (
  <div className="min-h-screen p-6 space-y-4" aria-label="Loading page">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full" />
    <div className="grid gap-4 md:grid-cols-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  </div>
);
