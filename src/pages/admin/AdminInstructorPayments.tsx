
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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

// Define instructor type
interface Instructor {
  id: number;
  name: string;
  email: string;
  hourlyRate: number;
  specialization: string;
}

const AdminInstructorPayments = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const { stats, isLoading } = useInstructorPayments();
  const [editPaymentId, setEditPaymentId] = useState<number | null>(null);
  const [showEditHoursDialog, setShowEditHoursDialog] = useState(false);
  const [showSetRateDialog, setShowSetRateDialog] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [hoursToChange, setHoursToChange] = useState<string>('');
  const [hoursOperation, setHoursOperation] = useState<'add' | 'subtract'>('add');
  const [newHourlyRate, setNewHourlyRate] = useState<string>('');
  
  // Mock data for instructors
  const [instructors, setInstructors] = useState<Instructor[]>([
    { id: 1, name: 'Professor Smith', email: 'smith@example.com', hourlyRate: 30, specialization: 'Turntablism' },
    { id: 2, name: 'DJ Mike', email: 'mike@example.com', hourlyRate: 28, specialization: 'Scratching' },
    { id: 3, name: 'Sarah Jones', email: 'sarah@example.com', hourlyRate: 32, specialization: 'Beat Mixing' },
    { id: 4, name: 'Robert Williams', email: 'robert@example.com', hourlyRate: 25, specialization: 'Production' },
    { id: 5, name: 'Laura Thompson', email: 'laura@example.com', hourlyRate: 27, specialization: 'Music Theory' },
  ]);
  
  // Mock data for payments
  const [payments, setPayments] = useState<InstructorPayment[]>([
    { 
      id: 1, 
      instructorId: 1, 
      instructorName: 'Professor Smith', 
      hourlyRate: 30, 
      hoursLogged: 24, 
      totalAmount: 720, 
      payPeriodStart: '2025-03-15', 
      payPeriodEnd: '2025-03-31', 
      status: 'pending',
      lastUpdated: '2025-04-01'
    },
    { 
      id: 2, 
      instructorId: 2, 
      instructorName: 'DJ Mike', 
      hourlyRate: 28, 
      hoursLogged: 20, 
      totalAmount: 560, 
      payPeriodStart: '2025-03-15', 
      payPeriodEnd: '2025-03-31', 
      status: 'pending',
      lastUpdated: '2025-04-01'
    },
    { 
      id: 3, 
      instructorId: 3, 
      instructorName: 'Sarah Jones', 
      hourlyRate: 32, 
      hoursLogged: 22, 
      totalAmount: 704, 
      payPeriodStart: '2025-03-15', 
      payPeriodEnd: '2025-03-31', 
      status: 'pending',
      lastUpdated: '2025-04-02'
    },
    { 
      id: 4, 
      instructorId: 1, 
      instructorName: 'Professor Smith', 
      hourlyRate: 30, 
      hoursLogged: 25, 
      totalAmount: 750, 
      payPeriodStart: '2025-03-01', 
      payPeriodEnd: '2025-03-14', 
      status: 'paid',
      lastUpdated: '2025-03-16'
    },
    { 
      id: 5, 
      instructorId: 2, 
      instructorName: 'DJ Mike', 
      hourlyRate: 28, 
      hoursLogged: 18, 
      totalAmount: 504, 
      payPeriodStart: '2025-03-01', 
      payPeriodEnd: '2025-03-14', 
      status: 'paid',
      lastUpdated: '2025-03-16'
    }
  ]);
  
  // Define payments lists from the mock data
  const pendingPayments = payments.filter(payment => payment.status === 'pending');
  const completedPayments = payments.filter(payment => payment.status === 'paid');
  
  const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  
  const filteredPendingPayments = pendingPayments.filter(payment => 
    payment.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCompletedPayments = completedPayments.filter(payment => 
    payment.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleMarkAsPaid = (paymentId: number) => {
    setPayments(payments.map(payment => 
      payment.id === paymentId ? { ...payment, status: 'paid' } : payment
    ));
    
    toast({
      title: 'Payment Marked as Paid',
      description: 'The instructor payment has been marked as paid.',
    });
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
  
  const handleUpdateHourlyRate = () => {
    if (!selectedInstructor) return;
    
    const rate = parseFloat(newHourlyRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Please enter a valid hourly rate.',
        variant: 'destructive',
      });
      return;
    }
    
    // Update instructor's hourly rate
    setInstructors(instructors.map(instructor => 
      instructor.id === selectedInstructor.id 
        ? { ...instructor, hourlyRate: rate } 
        : instructor
    ));
    
    // Update any pending payments for this instructor
    setPayments(payments.map(payment => {
      if (payment.instructorId === selectedInstructor.id && payment.status === 'pending') {
        const newTotal = payment.hoursLogged * rate;
        return {
          ...payment,
          hourlyRate: rate,
          totalAmount: newTotal,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return payment;
    }));
    
    toast({
      title: 'Hourly Rate Updated',
      description: `${selectedInstructor.name}'s hourly rate has been updated to $${rate}.`,
    });
    
    setShowSetRateDialog(false);
    setSelectedInstructor(null);
  };
  
  const handleEditHours = () => {
    if (!editPaymentId) return;
    
    const hours = parseFloat(hoursToChange);
    if (isNaN(hours) || hours <= 0) {
      toast({
        title: 'Invalid Hours',
        description: 'Please enter a valid number of hours.',
        variant: 'destructive',
      });
      return;
    }
    
    setPayments(payments.map(payment => {
      if (payment.id === editPaymentId) {
        const newHours = hoursOperation === 'add' 
          ? payment.hoursLogged + hours 
          : Math.max(0, payment.hoursLogged - hours);
        
        const newTotal = newHours * payment.hourlyRate;
        return {
          ...payment,
          hoursLogged: newHours,
          totalAmount: newTotal,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return payment;
    }));
    
    toast({
      title: hoursOperation === 'add' ? 'Hours Added' : 'Hours Subtracted',
      description: `${hours} hours have been ${hoursOperation === 'add' ? 'added to' : 'subtracted from'} the payment record.`,
    });
    
    setShowEditHoursDialog(false);
    setEditPaymentId(null);
  };

  // Format a date string to US format (MM/DD/YYYY)
  const formatDateToUS = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MM/dd/yyyy');
  };

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
          stats={{
            pendingPaymentsCount: pendingPayments.length,
            totalPendingAmount: totalPendingAmount,
            instructorRatesCount: instructors.length
          }}
          instructors={instructors}
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
                {instructors.map((instructor) => (
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
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Current Pay Period</CardTitle>
            <CardDescription>
              Pending payments for instructors (03/15/2025-03/31/2025)
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
