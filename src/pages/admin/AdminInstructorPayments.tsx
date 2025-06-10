import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { DollarSign, Save, Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { InstructorPaymentStatsCards } from '@/components/admin/instructor-payments/InstructorPaymentStatsCards';
import { InstructorPaymentSearch } from '@/components/admin/instructor-payments/InstructorPaymentSearch';
import { useInstructorPayments, InstructorPayment } from '@/hooks/useInstructorPayments';
import { supabase } from '@/integrations/supabase/client';

// Define instructor type
interface Instructor {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  specialization: string;
}

const AdminInstructorPayments = () => {
  // Fetch payments data from the hook
  const { payments, stats, isLoading } = useInstructorPayments();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [showEditHoursDialog, setShowEditHoursDialog] = useState(false);
  const [showSetRateDialog, setShowSetRateDialog] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [hoursToChange, setHoursToChange] = useState<string>('');
  const [hoursOperation, setHoursOperation] = useState<'add' | 'subtract'>('add');
  const [newHourlyRate, setNewHourlyRate] = useState<string>('');
  
  // Generate instructors list from payments data
  const instructorsList = React.useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const uniqueInstructors = new Map<string, Instructor>();
    
    payments.forEach(payment => {
      if (!uniqueInstructors.has(payment.instructorId || '')) {
        uniqueInstructors.set(payment.instructorId || '', {
          id: payment.instructorId || '',
          name: payment.instructorName,
          email: `${payment.instructorName.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Generate email for display
          hourlyRate: payment.hourlyRate,
          specialization: 'DJ Instruction', // Default value
        });
      }
    });
    
    return Array.from(uniqueInstructors.values());
  }, [payments]);
  
  // Split payments into pending and completed
  const pendingPayments = payments?.filter(payment => payment.status === 'pending') || [];
  const completedPayments = payments?.filter(payment => payment.status === 'paid') || [];
  
  const filteredPendingPayments = pendingPayments.filter(payment => 
    payment.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCompletedPayments = completedPayments.filter(payment => 
    payment.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      // Update payment status in the database
      const { error } = await supabase
        .from('instructor_payments')
        .update({ status: 'paid' } as any)
        .eq('id', paymentId as any);
      
      if (error) throw error;
      
      toast('Payment Marked as Paid', {
        description: 'The instructor payment has been marked as paid.'
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast('Error Updating Payment', {
        description: 'There was a problem marking the payment as paid.',
      });
    }
  };
  
  const openSetRateDialog = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setNewHourlyRate(instructor.hourlyRate.toString());
    setShowSetRateDialog(true);
  };
  
  const openEditHoursDialog = (payment: InstructorPayment) => {
    setEditPaymentId(payment.id);
    setHoursToChange('');
    setHoursOperation('add');
    setShowEditHoursDialog(true);
  };
  
  const handleUpdateHourlyRate = async () => {
    if (!selectedInstructor) return;
    
    const rate = parseFloat(newHourlyRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Invalid Rate', {
        description: 'Please enter a valid hourly rate.',
      });
      return;
    }
    
    try {
      // Update instructor's hourly rate in the database
      const { error } = await supabase
        .from('instructors')
        .update({ hourly_rate: rate } as any)
        .eq('id', selectedInstructor.id as any);
      
      if (error) throw error;
      
      toast('Hourly Rate Updated', {
        description: `${selectedInstructor.name}'s hourly rate has been updated to $${rate}.`,
      });
      
      setShowSetRateDialog(false);
      setSelectedInstructor(null);
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      toast('Error Updating Rate', {
        description: 'There was a problem updating the hourly rate.',
      });
    }
  };
  
  const handleEditHours = async () => {
    if (!editPaymentId) return;
    
    const hours = parseFloat(hoursToChange);
    if (isNaN(hours) || hours <= 0) {
      toast.error('Invalid Hours', {
        description: 'Please enter a valid number of hours.',
      });
      return;
    }
    
    try {
      // Find the current payment
      const payment = payments?.find(p => p.id === editPaymentId);
      if (!payment) throw new Error('Payment not found');
      
      // Calculate new hours
      const newHours = hoursOperation === 'add' 
        ? payment.hoursLogged + hours 
        : Math.max(0, payment.hoursLogged - hours);
      
      // Calculate new total amount
      const newTotal = newHours * payment.hourlyRate;
      
      // Update payment in the database
      const { error } = await supabase
        .from('instructor_payments')
        .update({ 
          hours_worked: newHours,
          amount: newTotal,
        } as any)
        .eq('id', editPaymentId as any);
      
      if (error) throw error;
      
      toast(hoursOperation === 'add' ? 'Hours Added' : 'Hours Subtracted', {
        description: `${hours} hours have been ${hoursOperation === 'add' ? 'added to' : 'subtracted from'} the payment record.`,
      });
      
      setShowEditHoursDialog(false);
      setEditPaymentId(null);
    } catch (error) {
      console.error('Error updating hours:', error);
      toast('Error Updating Hours', {
        description: 'There was a problem updating the hours worked.',
      });
    }
  };

  // Format a date string to US format (MM/DD/YYYY)
  const formatDateToUS = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MM/dd/yyyy');
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading instructor payments data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage instructor compensation and payment records
          </p>
        </div>

        <InstructorPaymentStatsCards
          stats={stats}
          instructors={instructorsList}
        />

        <InstructorPaymentSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Instructor Rate Management */}
        <Card>
          <CardHeader>
            <CardTitle>Instructor Rates</CardTitle>
            <CardDescription>
              Manage instructor hourly rates for payment calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {instructorsList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead className="text-right">Hourly Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorsList.map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="font-medium">{instructor.name}</TableCell>
                      <TableCell>{instructor.email}</TableCell>
                      <TableCell>{instructor.specialization}</TableCell>
                      <TableCell className="text-right">${instructor.hourlyRate}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSetRateDialog(instructor)}
                        >
                          Update Rate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No instructors found.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Current Pay Period</CardTitle>
            <CardDescription>
              Pending payments for instructors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPendingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.instructorName}</TableCell>
                      <TableCell className="text-right">${payment.hourlyRate}/hr</TableCell>
                      <TableCell className="text-right">{payment.hoursLogged}</TableCell>
                      <TableCell className="text-right">${payment.totalAmount}</TableCell>
                      <TableCell className="text-right">{formatDateToUS(payment.lastUpdated)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditHoursDialog(payment)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit Hours
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-green-500 text-white"
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            <Save className="mr-1 h-3 w-3" />
                            Mark Paid
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending payments found matching your search.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Previous instructor payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCompletedPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompletedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.instructorName}</TableCell>
                      <TableCell>
                        {formatDateToUS(payment.payPeriodStart)} to {formatDateToUS(payment.payPeriodEnd)}
                      </TableCell>
                      <TableCell className="text-right">${payment.hourlyRate}/hr</TableCell>
                      <TableCell className="text-right">{payment.hoursLogged}</TableCell>
                      <TableCell className="text-right">${payment.totalAmount}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          Paid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payment history found matching your search.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for editing hours */}
      <Dialog open={showEditHoursDialog} onOpenChange={setShowEditHoursDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Hours</DialogTitle>
            <DialogDescription>
              Add or subtract hours worked by the instructor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup 
              value={hoursOperation} 
              onValueChange={(value) => setHoursOperation(value as 'add' | 'subtract')}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add">Add Hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subtract" id="subtract" />
                <Label htmlFor="subtract">Subtract Hours</Label>
              </div>
            </RadioGroup>
            <div className="grid gap-2">
              <Label htmlFor="hours">Hours to {hoursOperation === 'add' ? 'Add' : 'Subtract'}</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                placeholder={`Enter hours to ${hoursOperation === 'add' ? 'add' : 'subtract'}`}
                value={hoursToChange}
                onChange={(e) => setHoursToChange(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditHoursDialog(false)}>Cancel</Button>
            <Button onClick={handleEditHours}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for setting hourly rate */}
      <Dialog open={showSetRateDialog} onOpenChange={setShowSetRateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set Hourly Rate</DialogTitle>
            <DialogDescription>
              {selectedInstructor && `Update hourly rate for ${selectedInstructor.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                step="0.50"
                min="1"
                placeholder="Enter hourly rate"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetRateDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateHourlyRate}>Update Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminInstructorPayments;
