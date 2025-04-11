
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-pulse space-y-2 flex flex-col items-center">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading dashboard data...</p>
      </div>
    </div>
  );
};
