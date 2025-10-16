
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { PaymentStatsCards } from '@/components/admin/payments/PaymentStatsCards';
import { PaymentSearch } from '@/components/admin/payments/PaymentSearch';
import { PaymentsTable } from '@/components/admin/payments/PaymentsTable';
import { CreatePaymentDialog } from '@/components/admin/payments/CreatePaymentDialog';
import { useAdminStudents } from '@/hooks/useAdminStudents';
import { useUpdatePayment } from '@/hooks/useUpdatePayment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPayments = () => {
  const { missedPayments, upcomingPayments, allPayments, isLoading, stats } = useAdminPayments();
  const { activeStudents } = useAdminStudents();
  const { updatePayment } = useUpdatePayment();
  const [searchQuery, setSearchQuery] = useState('');

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
        <div className="flex justify-between items-start">
          <div>
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
    </DashboardLayout>
  );
};

export default AdminPayments;
