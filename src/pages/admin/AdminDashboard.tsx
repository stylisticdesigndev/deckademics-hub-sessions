import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard = () => {
  // Mock data
  const pendingInstructors = 2;
  const pendingStudents = 5;
  const totalStudents = 43;
  const totalInstructors = 7;
  
  // Mock payment status data
  const paymentsData = {
    paid: 38,
    pending: 3,
    overdue: 2
  };
  
  return (
    <DashboardLayout
      sidebarContent={<AdminNavigation />}
      userType="admin"
    >
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
              <CardTitle className="text-sm font-medium">
                Total Students
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {pendingStudents} pending approval
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Instructors
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInstructors}</div>
              <p className="text-xs text-muted-foreground">
                {pendingInstructors} pending approval
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
                <span>Paid</span>
                <span>Pending</span>
                <span>Overdue</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-green-600">{paymentsData.paid}</span>
                <span className="text-amber-500">{paymentsData.pending}</span>
                <span className="text-red-500">{paymentsData.overdue}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="payments">Payment Status</TabsTrigger>
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
                    <h3 className="font-medium">New Instructor Registrations</h3>
                    <div className="mt-2 divide-y">
                      {[1, 2].map((i) => (
                        <div key={`instructor-${i}`} className="flex items-center justify-between py-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-deckademics-primary/20 flex items-center justify-center">
                              <span className="font-medium text-deckademics-primary">I{i}</span>
                            </div>
                            <div>
                              <p className="font-medium">John Instructor {i}</p>
                              <p className="text-sm text-muted-foreground">john{i}@example.com</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="rounded-md bg-green-500 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-green-600">
                              Approve
                            </button>
                            <button className="rounded-md bg-red-500 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-red-600">
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
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
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={`activity-${i}`} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div className="flex items-start space-x-4">
                        <div className="h-10 w-10 rounded-full bg-deckademics-primary/20 flex items-center justify-center">
                          <span className="font-medium text-deckademics-primary">A{i}</span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {i === 1 ? "New student approved" : 
                             i === 2 ? "Instructor assigned to class" :
                             "Payment received"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {i === 1 ? "Alex Johnson was approved" : 
                             i === 2 ? "Prof. Smith assigned to Beginner Class" :
                             "Payment for Advanced DJ Class"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {i === 1 ? "Just now" : 
                         i === 2 ? "2 hours ago" :
                         "Yesterday"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>
                  Overview of student payment status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-xl font-semibold">38</div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-xl font-semibold">3</div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-xl font-semibold">2</div>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
