
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

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
  
  // Activity log mock data with timestamps
  const mockActivities = [
    { id: 1, action: "New student approved", details: "Alex Johnson was approved", timestamp: new Date(2025, 3, 5, 14, 30) },
    { id: 2, action: "Instructor assigned to class", details: "Prof. Smith assigned to Beginner Class", timestamp: new Date(2025, 3, 5, 12, 15) },
    { id: 3, action: "Payment received", details: "Payment for Advanced DJ Class", timestamp: new Date(2025, 3, 5, 10, 45) },
    { id: 4, action: "New instructor declined", details: "Application from John Doe was declined", timestamp: new Date(2025, 3, 4, 16, 20) },
    { id: 5, action: "Announcement posted", details: "New schedule for summer classes", timestamp: new Date(2025, 3, 4, 14, 10) },
    { id: 6, action: "Student payment overdue", details: "Payment reminder sent to Mike Smith", timestamp: new Date(2025, 3, 4, 9, 30) },
    { id: 7, action: "Class cancelled", details: "Advanced Scratching class on April 10", timestamp: new Date(2025, 3, 3, 17, 45) },
    { id: 8, action: "New equipment added", details: "Two Pioneer DJ controllers added to inventory", timestamp: new Date(2025, 3, 3, 11, 20) },
  ];

  // Activity pagination state
  const [currentActivityPage, setCurrentActivityPage] = useState(1);
  const activitiesPerPage = 3;
  const totalActivityPages = Math.ceil(mockActivities.length / activitiesPerPage);
  
  // Get current activities
  const indexOfLastActivity = currentActivityPage * activitiesPerPage;
  const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
  const currentActivities = mockActivities.slice(indexOfFirstActivity, indexOfLastActivity);
  
  // Format relative time
  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return `${timestamp.getDate()}/${timestamp.getMonth() + 1}/${timestamp.getFullYear()}`;
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
                  {currentActivities.map((activity) => (
                    <div key={`activity-${activity.id}`} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div className="flex items-start space-x-4">
                        <div className="h-10 w-10 rounded-full bg-deckademics-primary/20 flex items-center justify-center">
                          <span className="font-medium text-deckademics-primary">A{activity.id}</span>
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.details}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-2">
                <Pagination className="w-full">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentActivityPage(prev => Math.max(prev - 1, 1))}
                        className={currentActivityPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalActivityPages)].map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink 
                          isActive={currentActivityPage === i + 1}
                          onClick={() => setCurrentActivityPage(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentActivityPage(prev => Math.min(prev + 1, totalActivityPages))}
                        className={currentActivityPage >= totalActivityPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardFooter>
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

