
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { toast } from 'sonner';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { PaymentStatsCards } from '@/components/admin/payments/PaymentStatsCards';
import { PaymentSearch } from '@/components/admin/payments/PaymentSearch';
import { PaymentsTable } from '@/components/admin/payments/PaymentsTable';

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
    toast(
      paymentType === 'full' ? "Payment Marked as Paid" : "Payment Marked as Partially Paid", 
      { 
        description: paymentType === 'full' 
          ? "The payment has been marked as fully paid and removed from the list." 
          : "The payment has been marked as partially paid."
      }
    );
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

        <PaymentStatsCards stats={stats} />
        <PaymentSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <PaymentsTable
          title="Missed Payments"
          description="Students with past due payments"
          payments={filteredMissedPayments}
          onMarkAsPaid={handleMarkAsPaid}
        />

        <PaymentsTable
          title="Payment History"
          description="Previous payments"
          payments={filteredUpcomingPayments}
          showActions={false}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminPayments;
