
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { toast } = useToast();
  
  // Mock data
  const [pendingInstructors, setPendingInstructors] = useState(2);
  const [pendingStudents, setPendingStudents] = useState(5);
  const [totalStudents, setTotalStudents] = useState(43);
  const [totalInstructors, setTotalInstructors] = useState(7);
  
  // Track which instructors and students have been approved or declined
  const [instructorStatus, setInstructorStatus] = useState<Record<number, 'approved' | 'declined' | null>>({
    1: null,
    2: null,
  });
  
  const [studentStatus, setStudentStatus] = useState<Record<number, 'approved' | 'declined' | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  });
  
  // Mock payment status data
  const paymentsData = {
    pending: 3,
    overdue: 2
  };
  
  const handleInstructorApprove = (instructorId: number) => {
    setInstructorStatus(prev => ({ ...prev, [instructorId]: 'approved' }));
    setPendingInstructors(prev => Math.max(0, prev - 1));
    setTotalInstructors(prev => prev + 1);
    toast({
      title: "Instructor approved",
      description: `Instructor ${instructorId} has been successfully approved.`,
    });
  };
  
  const handleInstructorDecline = (instructorId: number) => {
    setInstructorStatus(prev => ({ ...prev, [instructorId]: 'declined' }));
    setPendingInstructors(prev => Math.max(0, prev - 1));
    toast({
      title: "Instructor declined",
      description: `Instructor ${instructorId} has been declined.`,
    });
  };
  
  const handleStudentApprove = (studentId: number) => {
    setStudentStatus(prev => ({ ...prev, [studentId]: 'approved' }));
    setPendingStudents(prev => Math.max(0, prev - 1));
    setTotalStudents(prev => prev + 1);
    toast({
      title: "Student approved",
      description: `Student ${studentId} has been successfully approved.`,
    });
  };
  
  const handleStudentDecline = (studentId: number) => {
    setStudentStatus(prev => ({ ...prev, [studentId]: 'declined' }));
    setPendingStudents(prev => Math.max(0, prev - 1));
    toast({
      title: "Student declined",
      description: `Student ${studentId} has been declined.`,
    });
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
                <span>Pending</span>
                <span>Overdue</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
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
                {/* Changed the order: Students first, then Instructors */}
                <div className="rounded-md border">
                  <div className="p-4">
                    <h3 className="font-medium">New Student Registrations</h3>
                    <div className="mt-2 divide-y">
                      {[1, 2, 3, 4, 5].map((i) => (
                        studentStatus[i] === null && (
                          <div key={`student-${i}`} className="flex items-center justify-between py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="font-medium text-blue-500">S{i}</span>
                              </div>
                              <div>
                                <p className="font-medium">Jane Student {i}</p>
                                <p className="text-sm text-muted-foreground">jane{i}@example.com</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="default" 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleStudentApprove(i)}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleStudentDecline(i)}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        )
                      ))}
                      {pendingStudents === 0 && (
                        <div className="py-4 text-center text-muted-foreground">
                          No pending student approvals
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <div className="p-4">
                    <h3 className="font-medium">New Instructor Registrations</h3>
                    <div className="mt-2 divide-y">
                      {[1, 2].map((i) => (
                        instructorStatus[i] === null && (
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
                              <Button 
                                variant="default" 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleInstructorApprove(i)}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleInstructorDecline(i)}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        )
                      ))}
                      {pendingInstructors === 0 && (
                        <div className="py-4 text-center text-muted-foreground">
                          No pending instructor approvals
                        </div>
                      )}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-xl font-semibold text-amber-500">3</div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <div className="text-xl font-semibold text-red-500">2</div>
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
