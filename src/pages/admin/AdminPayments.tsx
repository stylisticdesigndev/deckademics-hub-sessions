
import React, { useState } from 'react';
import VinylLoader from '@/components/ui/VinylLoader';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { PaymentStatsCards } from '@/components/admin/payments/PaymentStatsCards';
import { PaymentSearch } from '@/components/admin/payments/PaymentSearch';
import { PaymentsTable } from '@/components/admin/payments/PaymentsTable';
import { CreatePaymentDialog } from '@/components/admin/payments/CreatePaymentDialog';
import { useAdminStudents } from '@/hooks/useAdminStudents';
import { useUpdatePayment } from '@/hooks/useUpdatePayment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { canAccessPayroll } from '@/constants/adminPermissions';

const AdminPayments = () => {
  const { userData } = useAuth();
  const userEmail = userData.profile?.email;
  const hasAccess = canAccessPayroll(userEmail);

  const { missedPayments, upcomingPayments, allPayments, isLoading, stats } = useAdminPayments();
  const { activeStudents } = useAdminStudents();
  const { updatePayment } = useUpdatePayment();
  const [searchQuery, setSearchQuery] = useState('');

  // Payroll security gate — owner only (after all hooks)
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view the Student Payments section. Only the account owner can access payroll data.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const students = activeStudents.map(student => ({
    id: student.id,
    first_name: student.profile.first_name || '',
    last_name: student.profile.last_name || '',
  }));

  const filteredMissedPayments = missedPayments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.amount.toString().includes(searchQuery)
  );

  const filteredUpcomingPayments = upcomingPayments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.amount.toString().includes(searchQuery)
  );

  const filteredAllPayments = allPayments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.amount.toString().includes(searchQuery) ||
    (payment.description && payment.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMarkAsPaid = async (paymentId: string) => {
    await updatePayment({
      id: paymentId,
      status: 'completed',
    });
  };

  if (isLoading) {
    return <VinylLoader message="Loading payments..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage student payments
            </p>
          </div>
          <CreatePaymentDialog students={students} />
        </div>

        <PaymentStatsCards stats={stats} />
        <PaymentSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({filteredMissedPayments.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({filteredUpcomingPayments.length})</TabsTrigger>
            <TabsTrigger value="all">All Payments ({filteredAllPayments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PaymentsTable
              title="Pending Payments"
              description="Students with pending payments"
              payments={filteredMissedPayments}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </TabsContent>

          <TabsContent value="upcoming">
            <PaymentsTable
              title="Upcoming Payments"
              description="Scheduled future payments"
              payments={filteredUpcomingPayments}
              showActions={false}
            />
          </TabsContent>

          <TabsContent value="all">
            <PaymentsTable
              title="All Payments"
              description="Complete payment history with full management"
              payments={filteredAllPayments}
              showActions={false}
              showEditDelete={true}
              students={students}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminPayments;
