
import React, { useState, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { canAccessPayroll } from '@/constants/adminPermissions';
import type { DateRange } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Calendar } from '@/components/ui/calendar';
import { Save, Edit, CalendarIcon, Zap, Loader2, Clock, Trash2, DollarSign, CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useInstructorPayments, InstructorPayment } from '@/hooks/useInstructorPayments';
import { useCreateInstructorPayment } from '@/hooks/useCreateInstructorPayment';
import { supabase } from '@/integrations/supabase/client';
import { calculateScheduledHours, GeneratedPayment, ScheduleEntry } from '@/utils/scheduleHours';
import { DAY_ORDER, CLASS_SLOTS, sanitizeScheduleItems, sanitizeScheduleHours } from '@/utils/instructorSchedule';

interface Instructor {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  specialization: string;
}

const AdminInstructorPayments = () => {
  const { userData } = useAuth();
  const userEmail = userData.profile?.email;
  const hasAccess = canAccessPayroll(userEmail);

  const { payments, isLoading, invalidate } = useInstructorPayments();
  const { createPayment, isPending: isCreating } = useCreateInstructorPayment();
  
  const [showHelpVideo, setShowHelpVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 10;
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [showEditHoursDialog, setShowEditHoursDialog] = useState(false);
  const [showSetRateDialog, setShowSetRateDialog] = useState(false);
  const [selectedDetailPayment, setSelectedDetailPayment] = useState<InstructorPayment | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateStep, setGenerateStep] = useState<'dates' | 'preview'>('dates');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [generatedPayments, setGeneratedPayments] = useState<GeneratedPayment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [hoursToChange, setHoursToChange] = useState<string>('');
  const [hoursOperation, setHoursOperation] = useState<'add' | 'subtract'>('add');
  const [newHourlyRate, setNewHourlyRate] = useState<string>('');
  
  const [instructorsList, setInstructorsList] = React.useState<Instructor[]>([]);
  
  // Schedule editor state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleInstructor, setScheduleInstructor] = useState<Instructor | null>(null);
  const [scheduleItems, setScheduleItems] = useState<{ day: string; hours: string }[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Add bonus to existing payment state
  const [showAddBonusToRowDialog, setShowAddBonusToRowDialog] = useState(false);
  const [bonusRowPaymentId, setBonusRowPaymentId] = useState<string | null>(null);
  const [bonusRowAmount, setBonusRowAmount] = useState('');
  const [bonusRowDescription, setBonusRowDescription] = useState('');

  // Delete payment state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchInstructors = async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, hourly_rate, specialties, profiles (first_name, last_name, email)')
        .eq('status', 'active' as any);
      
      if (error) {
        console.error('Error fetching instructors:', error);
        return;
      }
      
      const list: Instructor[] = (data || []).map((inst: any) => ({
        id: inst.id,
        name: `${inst.profiles?.first_name || ''} ${inst.profiles?.last_name || ''}`.trim() || 'Unknown',
        email: inst.profiles?.email || '',
        hourlyRate: inst.hourly_rate || 0,
        specialization: inst.specialties?.join(', ') || 'DJ Instruction',
      }));
      
      setInstructorsList(list);
    };
    fetchInstructors();
  }, []);

  // Payroll security gate — owner only (after all hooks)
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view the Instructor Payments section. Only the account owner can access payroll data.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const pendingPayments = payments?.filter(payment => payment.status === 'pending') || [];
  const completedPayments = payments?.filter(payment => payment.status === 'paid') || [];
  const totalHistoryPages = Math.ceil(completedPayments.length / HISTORY_PER_PAGE);
  const paginatedHistory = completedPayments.slice(
    (historyPage - 1) * HISTORY_PER_PAGE,
    historyPage * HISTORY_PER_PAGE
  );
  
  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('instructor_payments')
        .update({ status: 'paid' } as any)
        .eq('id', paymentId as any);
      
      if (error) throw error;
      
      toast.success('Payment marked as paid');
      invalidate();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to mark payment as paid');
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
      toast.error('Please enter a valid hourly rate.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('instructors')
        .update({ hourly_rate: rate } as any)
        .eq('id', selectedInstructor.id as any);
      
      if (error) throw error;
      
      toast.success(`${selectedInstructor.name}'s hourly rate updated to $${rate}`);
      setShowSetRateDialog(false);
      setSelectedInstructor(null);
      const updated = instructorsList.map(i => i.id === selectedInstructor.id ? { ...i, hourlyRate: rate } : i);
      setInstructorsList(updated);
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      toast.error('Failed to update hourly rate');
    }
  };
  
  const handleEditHours = async () => {
    if (!editPaymentId) return;
    
    const hours = parseFloat(hoursToChange);
    if (isNaN(hours) || hours <= 0) {
      toast.error('Please enter a valid number of hours.');
      return;
    }
    
    try {
      const payment = payments?.find(p => p.id === editPaymentId);
      if (!payment) throw new Error('Payment not found');
      
      const newHours = hoursOperation === 'add' 
        ? payment.hoursLogged + hours 
        : Math.max(0, payment.hoursLogged - hours);
      
      const newTotal = newHours * payment.hourlyRate;
      
      const { error } = await supabase
        .from('instructor_payments')
        .update({ hours_worked: newHours, amount: newTotal } as any)
        .eq('id', editPaymentId as any);
      
      if (error) throw error;
      
      toast.success(`${hours} hours ${hoursOperation === 'add' ? 'added' : 'subtracted'}`);
      setShowEditHoursDialog(false);
      setEditPaymentId(null);
      invalidate();
    } catch (error) {
      console.error('Error updating hours:', error);
      toast.error('Failed to update hours');
    }
  };

  const openAddBonusToRow = (paymentId: string) => {
    setBonusRowPaymentId(paymentId);
    const payment = payments?.find(p => p.id === paymentId);
    setBonusRowAmount(payment?.bonusAmount ? payment.bonusAmount.toString() : '');
    setBonusRowDescription(payment?.bonusDescription || '');
    setShowAddBonusToRowDialog(true);
  };

  const handleSaveBonusToRow = async () => {
    if (!bonusRowPaymentId) return;
    const amount = parseFloat(bonusRowAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bonus amount');
      return;
    }
    try {
      const { error } = await supabase
        .from('instructor_payments')
        .update({ bonus_amount: amount, bonus_description: bonusRowDescription || null } as any)
        .eq('id', bonusRowPaymentId as any);
      if (error) throw error;
      toast.success('Bonus added to payment');
      setShowAddBonusToRowDialog(false);
      invalidate();
    } catch (error) {
      console.error('Error adding bonus:', error);
      toast.error('Failed to add bonus');
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      const { error } = await supabase
        .from('instructor_payments')
        .delete()
        .eq('id', deletePaymentId as any);
      if (error) throw error;
      toast.success('Payment deleted');
      setShowDeleteDialog(false);
      setDeletePaymentId(null);
      invalidate();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  const openScheduleDialog = async (instructor: Instructor) => {
    setScheduleInstructor(instructor);
    const { data } = await supabase
      .from('instructor_schedules')
      .select('day, hours')
      .eq('instructor_id', instructor.id as any);
    setScheduleItems(sanitizeScheduleItems((data as any[] || []).map((r: any) => ({ day: r.day, hours: r.hours }))));
    setShowScheduleDialog(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleInstructor) return;
    setIsSavingSchedule(true);
    try {
      await supabase
        .from('instructor_schedules')
        .delete()
        .eq('instructor_id', scheduleInstructor.id as any);

      const sanitizedItems = sanitizeScheduleItems(scheduleItems);

      if (sanitizedItems.length > 0) {
        const rows = sanitizedItems.map(item => ({
          instructor_id: scheduleInstructor.id,
          day: item.day,
          hours: item.hours,
        }));
        const { error } = await supabase
          .from('instructor_schedules')
          .insert(rows as any);
        if (error) throw error;
      }

      toast.success(`Schedule saved for ${scheduleInstructor.name}`);
      setShowScheduleDialog(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const resetGenerateForm = () => {
    setDateRange(undefined);
    setGeneratedPayments([]);
    setGenerateStep('dates');
  };

  const handleGeneratePreview = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (dateRange.to <= dateRange.from) {
      toast.error('End date must be after start date');
      return;
    }

    setIsGenerating(true);

    try {
      const { data: schedulesData, error: schedError } = await supabase
        .from('instructor_schedules')
        .select('instructor_id, day, hours');

      if (schedError) throw schedError;

      const schedulesByInstructor: Record<string, ScheduleEntry[]> = {};
      for (const row of (schedulesData || []) as any[]) {
        const id = row.instructor_id;
        if (!schedulesByInstructor[id]) schedulesByInstructor[id] = [];
        schedulesByInstructor[id].push({ day: row.day, hours: row.hours });
      }

      const startStr = format(dateRange.from, 'yyyy-MM-dd');
      const endStr = format(dateRange.to, 'yyyy-MM-dd');

      const preview: GeneratedPayment[] = [];

      for (const inst of instructorsList) {
        const hasOverlap = pendingPayments.some(p => 
          p.instructorId === inst.id && 
          p.paymentType === 'class' &&
          p.payPeriodStart <= endStr && 
          p.payPeriodEnd >= startStr
        );

        if (hasOverlap) continue;

        const schedules = schedulesByInstructor[inst.id];
        if (!schedules || schedules.length === 0) continue;

        const { totalHours, totalAmount } = calculateScheduledHours(
          schedules,
          dateRange.from,
          dateRange.to,
          inst.hourlyRate
        );

        if (totalHours > 0) {
          preview.push({
            instructorId: inst.id,
            instructorName: inst.name,
            hourlyRate: inst.hourlyRate,
            totalHours,
            totalAmount,
          });
        }
      }

      if (preview.length === 0) {
        toast.error('No payments to generate. Instructors may not have schedules set, or already have pending payments for this period.');
        setIsGenerating(false);
        return;
      }

      setGeneratedPayments(preview);
      setGenerateStep('preview');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate payment preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmGenerate = async () => {
    if (!dateRange?.from || !dateRange?.to || generatedPayments.length === 0) return;

    setIsGenerating(true);
    const startStr = format(dateRange.from, 'yyyy-MM-dd');
    const endStr = format(dateRange.to, 'yyyy-MM-dd');

    try {
      for (const gp of generatedPayments) {
        await createPayment({
          instructor_id: gp.instructorId,
          amount: gp.totalAmount,
          hours_worked: gp.totalHours,
          pay_period_start: startStr,
          pay_period_end: endStr,
          payment_type: 'class',
          description: null,
        });
      }

      toast.success(`${generatedPayments.length} payment(s) generated successfully`);
      setShowGenerateDialog(false);
      resetGenerateForm();
    } catch (error) {
      console.error('Error creating payments:', error);
      toast.error('Failed to create some payments');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateToUS = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'MM/dd/yyyy');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading instructor payments data...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Instructor Payments</h1>
              <p className="text-muted-foreground mt-1">
                Manage instructor compensation and payment records
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowHelpVideo(true)}>
                    <CircleHelp className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>How to use Payroll</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button onClick={() => { resetGenerateForm(); setShowGenerateDialog(true); }}>
            <Zap className="mr-1 h-4 w-4" />
            Generate Pay Period
          </Button>
        </div>

        {/* Help Video Dialog */}
        <Dialog open={showHelpVideo} onOpenChange={(open) => {
          if (!open && videoRef.current) {
            videoRef.current.pause();
          }
          setShowHelpVideo(open);
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payroll Tutorial</DialogTitle>
              <DialogDescription>Learn how to use the instructor payroll system</DialogDescription>
            </DialogHeader>
            <video
              ref={videoRef}
              src="/videos/instructor-payroll-guide.mp4"
              controls
              className="w-full rounded-lg"
            />
          </DialogContent>
        </Dialog>

        {/* Total Payroll This Period */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll This Period</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingPayments.reduce((sum, p) => sum + p.totalAmount + p.bonusAmount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Instructor Rate Management */}
        <Card>
          <CardHeader>
            <CardTitle>Instructor Rates</CardTitle>
            <CardDescription>Manage instructor hourly rates for payment calculations</CardDescription>
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
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openScheduleDialog(instructor)}>
                            <Clock className="mr-1 h-3 w-3" />
                            Set Schedule
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openSetRateDialog(instructor)}>
                            Update Rate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No instructors found.</p>
            )}
          </CardContent>
        </Card>

        {/* Current Pay Period (Pending) */}
        <Card>
          <CardHeader>
            <CardTitle>Current Pay Period</CardTitle>
            <CardDescription>Pending payments awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.instructorName}</TableCell>
                      <TableCell>
                        {payment.paymentType === 'bonus' ? (
                          <Badge variant="secondary">Bonus</Badge>
                        ) : (
                          <Badge variant="outline">Class</Badge>
                        )}
                        {payment.description && (
                          <span className="ml-2 text-xs text-muted-foreground">{payment.description}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateToUS(payment.payPeriodStart)} – {formatDateToUS(payment.payPeriodEnd)}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.paymentType === 'class' ? `$${payment.hourlyRate}/hr` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.paymentType === 'class' ? payment.hoursLogged : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <span>${payment.totalAmount}</span>
                          {payment.bonusAmount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              + ${payment.bonusAmount} bonus
                              {payment.bonusDescription && (
                                <span className="italic"> ({payment.bonusDescription})</span>
                              )}
                            </div>
                          )}
                          {payment.bonusAmount > 0 && (
                            <div className="text-xs font-semibold">
                              Total: ${(payment.totalAmount + payment.bonusAmount).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {payment.paymentType === 'class' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEditHoursDialog(payment)}>
                                <Edit className="mr-1 h-3 w-3" />
                                Edit Hours
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openAddBonusToRow(payment.id)}>
                                <DollarSign className="mr-1 h-3 w-3" />
                                Bonus
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            <Save className="mr-1 h-3 w-3" />
                            Mark Paid
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setDeletePaymentId(payment.id); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No pending payments.</p>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Click a row to see full payment details</CardDescription>
          </CardHeader>
          <CardContent>
            {completedPayments.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Pay Period</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((payment) => (
                      <TableRow 
                        key={payment.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedDetailPayment(payment)}
                      >
                        <TableCell className="font-medium">{payment.instructorName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {payment.paymentType === 'bonus' ? (
                              <Badge variant="secondary">Bonus</Badge>
                            ) : (
                              <>
                                <Badge variant="outline">Class</Badge>
                                {payment.bonusAmount > 0 && (
                                  <Badge variant="secondary">+ Bonus</Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateToUS(payment.payPeriodStart)} – {formatDateToUS(payment.payPeriodEnd)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span>${(payment.totalAmount + payment.bonusAmount).toFixed(2)}</span>
                          {payment.bonusAmount > 0 && (
                            <div className="text-xs text-muted-foreground">includes bonus</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-accent text-accent-foreground">Paid</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalHistoryPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          className={historyPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === historyPage}
                            onClick={() => setHistoryPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                          className={historyPage >= totalHistoryPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No payment history found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedDetailPayment} onOpenChange={(open) => { if (!open) setSelectedDetailPayment(null); }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              {selectedDetailPayment?.instructorName} — {selectedDetailPayment && formatDateToUS(selectedDetailPayment.payPeriodStart)} to {selectedDetailPayment && formatDateToUS(selectedDetailPayment.payPeriodEnd)}
            </DialogDescription>
          </DialogHeader>
          {selectedDetailPayment && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Instructor</span>
                <span className="font-medium text-right">{selectedDetailPayment.instructorName}</span>
                
                <span className="text-muted-foreground">Payment Type</span>
                <span className="text-right capitalize">{selectedDetailPayment.paymentType}</span>
                
                <span className="text-muted-foreground">Pay Period</span>
                <span className="text-right">{formatDateToUS(selectedDetailPayment.payPeriodStart)} – {formatDateToUS(selectedDetailPayment.payPeriodEnd)}</span>
                
                {selectedDetailPayment.paymentType === 'class' && (
                  <>
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span className="text-right">${selectedDetailPayment.hourlyRate}/hr</span>
                    
                    <span className="text-muted-foreground">Hours Worked</span>
                    <span className="text-right">{selectedDetailPayment.hoursLogged}</span>
                  </>
                )}
                
                <span className="text-muted-foreground">Class Amount</span>
                <span className="text-right">${selectedDetailPayment.totalAmount.toFixed(2)}</span>
                
                {selectedDetailPayment.bonusAmount > 0 && (
                  <>
                    <span className="text-muted-foreground">Bonus Amount</span>
                    <span className="text-right text-primary">${selectedDetailPayment.bonusAmount.toFixed(2)}</span>
                    
                    {selectedDetailPayment.bonusDescription && (
                      <>
                        <span className="text-muted-foreground">Bonus Description</span>
                        <span className="text-right italic">{selectedDetailPayment.bonusDescription}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Grand Total</span>
                <span className="text-lg font-bold">
                  ${(selectedDetailPayment.totalAmount + selectedDetailPayment.bonusAmount).toFixed(2)}
                </span>
              </div>
              
              {selectedDetailPayment.description && (
                <div className="text-sm text-muted-foreground border-t pt-3">
                  <span className="font-medium">Notes:</span> {selectedDetailPayment.description}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Date Paid: {formatDateToUS(selectedDetailPayment.lastUpdated)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Pay Period Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={(open) => { setShowGenerateDialog(open); if (!open) resetGenerateForm(); }}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Generate Pay Period</DialogTitle>
            <DialogDescription>
              {generateStep === 'dates' 
                ? 'Select the pay period dates. The system will calculate hours from each instructor\'s weekly schedule.'
                : 'Review the calculated payments below before confirming.'}
            </DialogDescription>
          </DialogHeader>

          {generateStep === 'dates' && (
            <>
              <div className="py-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Start: </span>
                    <span className="font-medium">{dateRange?.from ? format(dateRange.from, 'MM/dd/yyyy') : '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End: </span>
                    <span className="font-medium">{dateRange?.to ? format(dateRange.to, 'MM/dd/yyyy') : '—'}</span>
                  </div>
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="p-3 pointer-events-auto rounded-md border"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowGenerateDialog(false); resetGenerateForm(); }}>Cancel</Button>
                <Button onClick={handleGeneratePreview} disabled={isGenerating || !dateRange?.from || !dateRange?.to}>
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : 'Preview Payments'}
                </Button>
              </DialogFooter>
            </>
          )}

          {generateStep === 'preview' && (
            <>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Period: {dateRange?.from && format(dateRange.from, 'MM/dd/yyyy')} – {dateRange?.to && format(dateRange.to, 'MM/dd/yyyy')}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedPayments.map((gp) => (
                      <TableRow key={gp.instructorId}>
                        <TableCell className="font-medium">{gp.instructorName}</TableCell>
                        <TableCell className="text-right">${gp.hourlyRate}/hr</TableCell>
                        <TableCell className="text-right">{gp.totalHours}</TableCell>
                        <TableCell className="text-right">${gp.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-3 flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total ({generatedPayments.length} instructor{generatedPayments.length !== 1 ? 's' : ''})</span>
                  <span>${generatedPayments.reduce((sum, gp) => sum + gp.totalAmount, 0).toFixed(2)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateStep('dates')}>Back</Button>
                <Button onClick={handleConfirmGenerate} disabled={isGenerating}>
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : `Create ${generatedPayments.length} Payment(s)`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Hours Dialog */}
      <Dialog open={showEditHoursDialog} onOpenChange={setShowEditHoursDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Hours</DialogTitle>
            <DialogDescription>Add or subtract hours worked by the instructor</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={hoursOperation} onValueChange={(v) => setHoursOperation(v as 'add' | 'subtract')} className="flex items-center space-x-4">
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
              <Input id="hours" type="number" step="0.5" min="0.5" placeholder={`Enter hours to ${hoursOperation}`} value={hoursToChange} onChange={(e) => setHoursToChange(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditHoursDialog(false)}>Cancel</Button>
            <Button onClick={handleEditHours}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Rate Dialog */}
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
              <Input id="rate" type="number" step="0.50" min="1" placeholder="Enter hourly rate" value={newHourlyRate} onChange={(e) => setNewHourlyRate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetRateDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateHourlyRate}>Save Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Editor Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Set Schedule — {scheduleInstructor?.name}</DialogTitle>
            <DialogDescription>
              Click the slots this instructor teaches. Used to auto-generate pay period payments.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {(() => {
              const DAYS = [...DAY_ORDER];
              const SLOTS = [...CLASS_SLOTS];
              const SLOT_LABELS = ['3:30–5:00', '5:30–7:00', '7:30–9:00'];

              const selected = new Set<string>();
              scheduleItems.forEach(item => {
                const slots = sanitizeScheduleHours(item.hours).split(', ').map(s => s.trim()).filter(Boolean);
                slots.forEach(slot => selected.add(`${item.day}|${slot}`));
              });

              const toggle = (day: string, slot: string) => {
                const key = `${day}|${slot}`;
                const next = new Set(selected);
                if (next.has(key)) next.delete(key); else next.add(key);
                // Convert back to scheduleItems format
                const newItems: typeof scheduleItems = [];
                DAYS.forEach(d => {
                  const daySlots = SLOTS.filter(s => next.has(`${d}|${s}`));
                  if (daySlots.length > 0) {
                    newItems.push({ day: d, hours: daySlots.join(', ') });
                  }
                });
                setScheduleItems(newItems);
              };

              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Day</TableHead>
                      {SLOT_LABELS.map((label, i) => (
                        <TableHead key={i} className="text-center">{label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DAYS.map(day => (
                      <TableRow key={day}>
                        <TableCell className="font-medium py-2">{day}</TableCell>
                        {SLOTS.map((slot, i) => (
                          <TableCell key={i} className="text-center py-2">
                            <Checkbox
                              checked={selected.has(`${day}|${slot}`)}
                              onCheckedChange={() => toggle(day, slot)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </div>
          <DialogFooter className="flex flex-row justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSchedule} disabled={isSavingSchedule}>
              {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bonus to Row Dialog */}
      <Dialog open={showAddBonusToRowDialog} onOpenChange={setShowAddBonusToRowDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Bonus to Payment</DialogTitle>
            <DialogDescription>Attach a bonus amount to this class payment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Bonus Amount ($)</Label>
              <Input type="number" step="0.01" min="1" placeholder="Enter bonus amount" value={bonusRowAmount} onChange={(e) => setBonusRowAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="e.g., Event DJ, Extra class..." value={bonusRowDescription} onChange={(e) => setBonusRowDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBonusToRowDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveBonusToRow}>Save Bonus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this payment? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeletePaymentId(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePayment}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminInstructorPayments;
