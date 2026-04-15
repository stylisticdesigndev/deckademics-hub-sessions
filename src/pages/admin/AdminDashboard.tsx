
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  Bell,
  MessageSquare,
  Bug,
  Settings,
  Music,
  Headphones,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { canAccessPayroll } from '@/constants/adminPermissions';

interface AdminDashboardProps {
  dashboardData: any;
  pendingInstructors: any[];
  paymentStats: any;
  pendingStudents: any[];
}

const AdminDashboard = ({ dashboardData, pendingInstructors, paymentStats, pendingStudents }: AdminDashboardProps) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const userEmail = userData.profile?.email;
  const showPayroll = canAccessPayroll(userEmail);

  const djOpsItems = [
    { title: "Instructors", icon: Users, href: "/admin/instructors", desc: "Manage teaching staff" },
    { title: "Students", icon: GraduationCap, href: "/admin/students", desc: "Manage student roster" },
    { title: "Curriculum", icon: BookOpen, href: "/admin/curriculum", desc: "Course modules & lessons" },
    { title: "Skills", icon: Target, href: "/admin/skills", desc: "Trackable assessments" },
    { title: "Progress Overview", icon: TrendingUp, href: "/admin/progress", desc: "Student proficiency" },
    { title: "Attendance", icon: ClipboardCheck, href: "/admin/attendance", desc: "Class attendance records" },
    ...(showPayroll ? [
      { title: "Student Payments", icon: CreditCard, href: "/admin/payments", desc: "Tuition & billing" },
      { title: "Instructor Payments", icon: DollarSign, href: "/admin/instructor-payments", desc: "Payroll management" },
    ] : []),
    { title: "Messages", icon: MessageSquare, href: "/admin/messages", desc: "Communication hub" },
    { title: "Announcements", icon: Bell, href: "/admin/announcements", desc: "Broadcast updates" },
    { title: "Bug Reports", icon: Bug, href: "/admin/bug-reports", desc: "Issue tracking" },
    { title: "Settings", icon: Settings, href: "/admin/settings", desc: "App configuration" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control Center</h1>
        <p className="text-muted-foreground">
          Deckademics Administration Portal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
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
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalInstructors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.pendingInstructors || 0} pending approval
            </p>
          </CardContent>
        </Card>
        {showPayroll && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Overdue</span>
                <span>Upcoming</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{paymentStats.missedPaymentsCount}</span>
                <span>{paymentStats.upcomingPaymentsCount}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>${paymentStats.totalMissedAmount.toLocaleString()}</span>
                <span>${paymentStats.totalUpcomingAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Split Control Center */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DJ School Operations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-deckademics-primary" />
              <CardTitle>DJ School Operations</CardTitle>
            </div>
            <CardDescription>Manage all DJ school functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {djOpsItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Music Production Operations — Placeholder */}
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-muted-foreground">Music Production Operations</CardTitle>
            </div>
            <CardDescription>Production school management</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground/70 max-w-xs mt-2">
              Music production management tools are currently under development and will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Students and instructors waiting for account approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="font-medium">New Student Registrations</h3>
              <div className="mt-2 divide-y">
                {pendingStudents && pendingStudents.length > 0 ? (
                  pendingStudents.map((student) => (
                    <div key={student.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/students?tab=pending')}>
                        View Details
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground">No pending student approvals</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="font-medium">New Instructor Registrations</h3>
              <div className="mt-2 divide-y">
                {pendingInstructors && pendingInstructors.length > 0 ? (
                  pendingInstructors.map((instructor) => (
                    <div key={instructor.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{instructor.profile.first_name} {instructor.profile.last_name}</p>
                        <p className="text-sm text-muted-foreground">{instructor.profile.email}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate('/admin/instructors?tab=pending')}>
                        View Details
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground">No pending instructor approvals</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
