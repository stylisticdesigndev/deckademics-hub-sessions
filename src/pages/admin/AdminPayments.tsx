import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, CreditCard, Calendar } from 'lucide-react';
import { useAdminPayments } from '@/hooks/useAdminPayments';

const AdminPayments = () => {
  const { missedPayments, upcomingPayments, isLoading, stats } = useAdminPayments();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMissedPayments = missedPayments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUpcomingPayments = upcomingPayments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkAsPaid = (paymentId: string, paymentType: 'full' | 'partial') => {
    // Implementation will be added when we integrate with the payment processing system
    toast({
      title: paymentType === 'full' ? "Payment Marked as Paid" : "Payment Marked as Partially Paid",
      description: paymentType === 'full' 
        ? "The payment has been marked as fully paid and removed from the list." 
        : "The payment has been marked as partially paid.",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading payments...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage student payments
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Missed Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.missedPaymentsCount}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.totalMissedAmount} past due
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
              <div className="text-2xl font-bold">{stats.upcomingPaymentsCount}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.totalUpcomingAmount} due within 2 weeks
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Missed Payments</CardTitle>
            <CardDescription>Students with past due payments</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMissedPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMissedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.email}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.dueDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {payment.daysPastDue} days past due
                          </Badge>
                          {payment.partiallyPaid && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              Partially Paid
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleMarkAsPaid(payment.id, 'full')}
                          >
                            <Check className="h-3 w-3" />
                            Fully Paid
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleMarkAsPaid(payment.id, 'partial')}
                          >
                            Partial
                          </Button>
                        </div>
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
            {filteredUpcomingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Until Due</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUpcomingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell>{payment.email}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.dueDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                            Due in {payment.daysTillDue} days
                          </Badge>
                          {payment.partiallyPaid && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              Partially Paid
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleMarkAsPaid(payment.id, 'full')}
                          >
                            <Check className="h-3 w-3" />
                            Fully Paid
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleMarkAsPaid(payment.id, 'partial')}
                          >
                            Partial
                          </Button>
                        </div>
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
