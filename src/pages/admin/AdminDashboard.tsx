import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const { toast } = useToast();
  const { data: dashboardData, isLoading, error } = useAdminDashboard();

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load dashboard data',
      variant: 'destructive',
    });
  }

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the Deckademics administration panel.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.pendingStudents || 0} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalInstructors || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.pendingInstructors || 0} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Status
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Pending</span>
                <span>Overdue</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>3</span>
                <span>2</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Students and instructors waiting for account approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border">
                  <div className="p-4">
                    <h3 className="font-medium">New Student Registrations</h3>
                    <div className="mt-2 divide-y">
                      
                      <div className="py-4 text-center text-muted-foreground">
                        No pending student approvals
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <div className="p-4">
                    <h3 className="font-medium">New Instructor Registrations</h3>
                    <div className="mt-2 divide-y">
                      
                      <div className="py-4 text-center text-muted-foreground">
                        No pending instructor approvals
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions in the DJ School platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
