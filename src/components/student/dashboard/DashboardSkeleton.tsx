
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 rounded-md" />
            <Skeleton className="h-36 w-full rounded-md" />
            
            <Skeleton className="h-8 w-1/3 rounded-md" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>
      </div>
      
      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Loading dashboard data... This may take a moment.</p>
      </Card>
    </div>
  );
};
