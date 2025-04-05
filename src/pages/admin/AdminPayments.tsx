
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock payment data
const paymentData = [
  {
    id: 1,
    studentName: "Alex Johnson",
    email: "alex@example.com",
    amount: 250,
    dueDate: "2025-04-10",
    status: "missed",
    daysPastDue: 5
  },
  {
    id: 2,
    studentName: "Jamie Smith",
    email: "jamie@example.com",
    amount: 250,
    dueDate: "2025-04-12",
    status: "upcoming",
    daysTillDue: 7
  },
  {
    id: 3,
    studentName: "Taylor Brown",
    email: "taylor@example.com",
    amount: 250,
    dueDate: "2025-04-15",
    status: "upcoming",
    daysTillDue: 10
  },
  {
    id: 4,
    studentName: "Morgan Wilson",
    email: "morgan@example.com",
    amount: 250,
    dueDate: "2025-03-30",
    status: "missed",
    daysPastDue: 16
  },
  {
    id: 5,
    studentName: "Jordan Lee",
    email: "jordan@example.com",
    amount: 250,
    dueDate: "2025-04-18",
    status: "upcoming",
    daysTillDue: 13
  }
];

const AdminPayments = () => {
  const missedPayments = paymentData.filter(payment => payment.status === "missed");
  const upcomingPayments = paymentData.filter(payment => payment.status === "upcoming");
  
  const totalMissed = missedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalUpcoming = upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage student payments
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$15,231.89</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Missed Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{missedPayments.length}</div>
              <p className="text-xs text-muted-foreground">
                ${totalMissed} past due
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Payments
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingPayments.length}</div>
              <p className="text-xs text-muted-foreground">
                ${totalUpcoming} due within 2 weeks
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Missed Payments</CardTitle>
            <CardDescription>Students with past due payments</CardDescription>
          </CardHeader>
          <CardContent>
            {missedPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.email}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {payment.daysPastDue} days past due
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No missed payments.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Payments due within the next two weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Until Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.email}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                          Due in {payment.daysTillDue} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming payments within the next two weeks.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPayments;
