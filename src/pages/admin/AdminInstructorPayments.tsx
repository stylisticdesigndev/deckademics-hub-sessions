
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
import { Save, Edit, CalendarIcon, Zap, Loader2, Clock, Trash2, DollarSign, CircleHelp, XCircle, RotateCcw } from 'lucide-react';
import { ChevronDown, User as UserIcon, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { calculateScheduledSessions, GeneratedPayment, ScheduleEntry } from '@/utils/scheduleHours';
import { DAY_ORDER, CLASS_SLOTS, sanitizeScheduleItems, sanitizeScheduleHours } from '@/utils/instructorSchedule';
import { useInstructorPaymentExtras } from '@/hooks/useInstructorPaymentExtras';
import { ExtraPayDialog } from '@/components/admin/payments/ExtraPayDialog';
import { Plus } from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  email: string;
  sessionFee: number;
  specialization: string;
}

const AdminInstructorPayments = () => {
  const { userData } = useAuth();
  const userEmail = userData.profile?.email;
  const hasAccess = canAccessPayroll(userEmail);

  const { payments, isLoading, invalidate } = useInstructorPayments();
  const { createPayment, isPending: isCreating } = useCreateInstructorPayment();
  const {
    extras: allExtras,
    extrasByPayment,
    sumExtras,
    saveExtras,
  } = useInstructorPaymentExtras();
  
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
  // Multi-select: empty array = ALL instructors
  const [generateScopedIds, setGenerateScopedIds] = useState<string[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [hoursToChange, setHoursToChange] = useState<string>('');
  const [hoursOperation, setHoursOperation] = useState<'add' | 'subtract'>('add');
  const [newSessionFee, setNewSessionFee] = useState<string>('');
  
  const [instructorsList, setInstructorsList] = React.useState<Instructor[]>([]);
  
  // Schedule editor state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleInstructor, setScheduleInstructor] = useState<Instructor | null>(null);
  const [scheduleItems, setScheduleItems] = useState<{ day: string; hours: string }[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Extra Pay dialog state (replaces legacy single-bonus flow)
  const [showExtraPayDialog, setShowExtraPayDialog] = useState(false);
  const [extraPayPaymentId, setExtraPayPaymentId] = useState<string | null>(null);
  const [extraPayInstructorId, setExtraPayInstructorId] = useState<string | null>(null);
  const [extraPayInstructorName, setExtraPayInstructorName] = useState<string>('');

  // Standalone Extra Pay (no payroll generation) dialog state
  const [showStandaloneExtra, setShowStandaloneExtra] = useState(false);
  const [standaloneInstructorId, setStandaloneInstructorId] = useState<string>('');
  const [standaloneItems, setStandaloneItems] = useState<{ _key: string; event_date: string; description: string; amount: string }[]>([]);
  const [standaloneNewDate, setStandaloneNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [standaloneNewDesc, setStandaloneNewDesc] = useState('');
  const [standaloneNewAmount, setStandaloneNewAmount] = useState('');
  const [standaloneSaving, setStandaloneSaving] = useState(false);

  // Delete payment state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchInstructors = async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, session_fee, specialties, profiles (first_name, last_name, dj_name, email)')
        .eq('status', 'active' as any);
      
      if (error) {
        console.error('Error fetching instructors:', error);
        return;
      }
      
      const list: Instructor[] = (data || []).map((inst: any) => ({
        id: inst.id,
        name:
          (inst.profiles?.dj_name || '').trim() ||
          `${inst.profiles?.first_name || ''} ${inst.profiles?.last_name || ''}`.trim() ||
          'Unknown',
        email: inst.profiles?.email || '',
        sessionFee: typeof inst.session_fee === 'number' ? inst.session_fee : 50,
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
  const completedPayments = payments?.filter(payment => payment.status === 'paid' || payment.status === 'void') || [];
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

  const handleVoidPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('instructor_payments')
        .update({ status: 'void' } as any)
        .eq('id', paymentId as any);
      if (error) throw error;
      toast.success('Payment voided');
      invalidate();
    } catch (error) {
      console.error('Error voiding payment:', error);
      toast.error('Failed to void payment');
    }
  };

  const handleRestorePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('instructor_payments')
        .update({ status: 'paid' } as any)
        .eq('id', paymentId as any);
      if (error) throw error;
      toast.success('Payment restored');
      invalidate();
    } catch (error) {
      console.error('Error restoring payment:', error);
      toast.error('Failed to restore payment');
    }
  };
  
  const openSetRateDialog = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setNewSessionFee(instructor.sessionFee.toString());
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
    
    const fee = parseFloat(newSessionFee);
    if (isNaN(fee) || fee < 0) {
      toast.error('Please enter a valid class rate.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('instructors')
        .update({ session_fee: fee } as any)
        .eq('id', selectedInstructor.id as any);
      
      if (error) throw error;
      
      toast.success(`${selectedInstructor.name} updated — $${fee}/class`);
      setShowSetRateDialog(false);
      setSelectedInstructor(null);
      const updated = instructorsList.map(i => i.id === selectedInstructor.id ? { ...i, sessionFee: fee } : i);
      setInstructorsList(updated);
    } catch (error) {
      console.error('Error updating class rate:', error);
      toast.error('Failed to update rate');
    }
  };
  
  const handleEditHours = async () => {
    if (!editPaymentId) return;
    
    const hours = parseFloat(hoursToChange);
    if (isNaN(hours) || hours <= 0) {
      toast.error('Please enter a valid number of classes.');
      return;
    }
    
    try {
      const payment = payments?.find(p => p.id === editPaymentId);
      if (!payment) throw new Error('Payment not found');
      
      const newHours = hoursOperation === 'add' 
        ? payment.hoursLogged + hours 
        : Math.max(0, payment.hoursLogged - hours);
      
      // hoursLogged is repurposed as "sessions" for class-type payments
      const perSession = payment.hoursLogged > 0
        ? payment.totalAmount / payment.hoursLogged
        : payment.hourlyRate || 50;
      const newTotal = newHours * perSession;
      
      const { error } = await supabase
        .from('instructor_payments')
        .update({ hours_worked: newHours, amount: newTotal } as any)
        .eq('id', editPaymentId as any);
      
      if (error) throw error;
      
      toast.success(`${hours} class${hours === 1 ? '' : 'es'} ${hoursOperation === 'add' ? 'added' : 'subtracted'}`);
      setShowEditHoursDialog(false);
      setEditPaymentId(null);
      invalidate();
    } catch (error) {
      console.error('Error updating classes:', error);
      toast.error('Failed to update classes');
    }
  };

  const openExtraPayForPayment = (payment: InstructorPayment) => {
    setExtraPayPaymentId(payment.id);
    setExtraPayInstructorId(payment.instructorId || null);
    setExtraPayInstructorName(payment.instructorName);
    setShowExtraPayDialog(true);
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
    setGenerateScopedIds([]);
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

      const scopedList = generateScopedIds.length > 0
        ? instructorsList.filter(i => generateScopedIds.includes(i.id))
        : instructorsList;

      for (const inst of scopedList) {
        const hasOverlap = pendingPayments.some(p => 
          p.instructorId === inst.id && 
          p.paymentType === 'class' &&
          p.payPeriodStart <= endStr && 
          p.payPeriodEnd >= startStr
        );

        if (hasOverlap) continue;

        const schedules = schedulesByInstructor[inst.id];
        if (!schedules || schedules.length === 0) continue;

        const { totalSessions, totalAmount } = calculateScheduledSessions(
          schedules,
          dateRange.from,
          dateRange.to,
          inst.sessionFee
        );

        if (totalSessions > 0) {
          preview.push({
            instructorId: inst.id,
            instructorName: inst.name,
            sessionFee: inst.sessionFee,
            totalSessions,
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
          hours_worked: gp.totalSessions,
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

  // ===== Standalone Extra Pay (no payroll period) =====
  const openStandaloneExtra = () => {
    setStandaloneInstructorId('');
    setStandaloneItems([]);
    setStandaloneNewDate(format(new Date(), 'yyyy-MM-dd'));
    setStandaloneNewDesc('');
    setStandaloneNewAmount('');
    setShowStandaloneExtra(true);
  };

  const addStandaloneItem = () => {
    const amt = parseFloat(standaloneNewAmount);
    if (!standaloneNewDate || isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid date and pay rate');
      return;
    }
    setStandaloneItems(prev => [
      ...prev,
      {
        _key: `${Date.now()}-${Math.random()}`,
        event_date: standaloneNewDate,
        description: standaloneNewDesc.trim(),
        amount: standaloneNewAmount,
      },
    ]);
    setStandaloneNewDesc('');
    setStandaloneNewAmount('');
  };

  const removeStandaloneItem = (key: string) => {
    setStandaloneItems(prev => prev.filter(i => i._key !== key));
  };

  const standaloneTotal = standaloneItems.reduce(
    (acc, i) => acc + (parseFloat(i.amount) || 0),
    0,
  );

  const saveStandaloneExtra = async () => {
    if (!standaloneInstructorId) {
      toast.error('Please select an instructor');
      return;
    }
    if (standaloneItems.length === 0) {
      toast.error('Add at least one extra pay line item');
      return;
    }
    setStandaloneSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: created, error: insErr } = await supabase
        .from('instructor_payments')
        .insert([{
          instructor_id: standaloneInstructorId,
          amount: 0,
          hours_worked: null,
          pay_period_start: today,
          pay_period_end: today,
          payment_type: 'bonus',
          description: 'Extra pay',
          status: 'pending',
          payment_date: new Date().toISOString(),
        } as any])
        .select('id')
        .single();
      if (insErr || !created) throw insErr || new Error('No payment created');

      const ok = await saveExtras(
        (created as any).id,
        standaloneInstructorId,
        standaloneItems.map(i => ({
          event_date: i.event_date,
          description: i.description || null,
          amount: parseFloat(i.amount) || 0,
        })),
      );
      if (!ok) throw new Error('Failed to save line items');

      toast.success('Extra pay recorded');
      invalidate();
      setShowStandaloneExtra(false);
    } catch (err) {
      console.error('Standalone extra pay save failed', err);
      toast.error('Failed to record extra pay');
    } finally {
      setStandaloneSaving(false);
    }
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
          <div className="flex items-center gap-2">
            <Button onClick={() => { resetGenerateForm(); setShowGenerateDialog(true); }}>
              <Zap className="mr-1 h-4 w-4" />
              Generate All
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-between">
                  <span className="flex items-center">
                    <UserIcon className="mr-1 h-4 w-4" />
                    Generate Selected
                  </span>
                  <span className="flex items-center">
                    {generateScopedIds.length > 0 && (
                      <Badge variant="secondary" className="mr-2">{generateScopedIds.length}</Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
                <DropdownMenuLabel>Pick one or more instructors</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {instructorsList.length === 0 ? (
                  <DropdownMenuItem disabled>No active instructors</DropdownMenuItem>
                ) : (
                  <>
                    {instructorsList.map(inst => {
                      const checked = generateScopedIds.includes(inst.id);
                      return (
                        <DropdownMenuItem
                          key={inst.id}
                          onSelect={(e) => {
                            e.preventDefault();
                            setGenerateScopedIds(prev =>
                              prev.includes(inst.id)
                                ? prev.filter(id => id !== inst.id)
                                : [...prev, inst.id]
                            );
                          }}
                          className="flex items-center gap-2"
                        >
                          <Checkbox checked={checked} className="pointer-events-none" />
                          <span className="flex-1">{inst.name}</span>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGenerateScopedIds([])}
                        disabled={generateScopedIds.length === 0}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (generateScopedIds.length === 0) {
                            toast.error('Pick at least one instructor');
                            return;
                          }
                          setShowGenerateDialog(true);
                        }}
                      >
                        Continue ({generateScopedIds.length})
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={openStandaloneExtra}>
              <DollarSign className="mr-1 h-4 w-4" />
              Add Extra Pay
            </Button>
          </div>
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
              ${pendingPayments
                .reduce(
                  (sum, p) =>
                    sum + p.totalAmount + sumExtras(extrasByPayment(p.id)),
                  0,
                )
                .toFixed(2)}
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
            <CardDescription>Manage the class rate paid to each instructor</CardDescription>
          </CardHeader>
          <CardContent>
            {instructorsList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead className="text-right">Class Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorsList.map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="font-medium">{instructor.name}</TableCell>
                      <TableCell>{instructor.email}</TableCell>
                      <TableCell>{instructor.specialization}</TableCell>
                      <TableCell className="text-right">${instructor.sessionFee}/class</TableCell>
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
                    <TableHead className="text-right">Class Rate</TableHead>
                    <TableHead className="text-right">Classes</TableHead>
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
                        {payment.paymentType === 'class' && payment.hoursLogged > 0
                          ? `$${(payment.totalAmount / payment.hoursLogged).toFixed(2)}/class`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.paymentType === 'class' ? payment.hoursLogged : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const items = extrasByPayment(payment.id);
                          const extraTotal = sumExtras(items);
                          return (
                            <div>
                              <span>${payment.totalAmount.toFixed(2)}</span>
                              {items.length > 0 && (
                                <>
                                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                                    {items.map((e) => (
                                      <div key={e.id} className="whitespace-normal">
                                        + ${Number(e.amount).toFixed(2)}{' '}
                                        <span className="italic">
                                          ({format(new Date(e.event_date), 'MM/dd')}
                                          {e.description ? ` — ${e.description}` : ''})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-xs font-semibold mt-1">
                                    Total: ${(payment.totalAmount + extraTotal).toFixed(2)}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {payment.paymentType === 'class' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEditHoursDialog(payment)}>
                                <Edit className="mr-1 h-3 w-3" />
                                Edit Classes
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openExtraPayForPayment(payment)}>
                                <DollarSign className="mr-1 h-3 w-3" />
                                Extra Pay
                                {extrasByPayment(payment.id).length > 0 && (
                                  <Badge variant="secondary" className="ml-1.5">
                                    {extrasByPayment(payment.id).length}
                                  </Badge>
                                )}
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((payment) => (
                      <TableRow 
                        key={payment.id} 
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          payment.status === 'void' && "opacity-60 [&_td]:line-through"
                        )}
                        onClick={() => setSelectedDetailPayment(payment)}
                      >
                        <TableCell className="font-medium">{payment.instructorName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {payment.paymentType === 'bonus' ? (
                              <Badge variant="secondary">Bonus</Badge>
                            ) : (
                              <Badge variant="outline">Class</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateToUS(payment.payPeriodStart)} – {formatDateToUS(payment.payPeriodEnd)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const extraTotal = sumExtras(extrasByPayment(payment.id));
                            return (
                              <>
                                <span>${(payment.totalAmount + extraTotal).toFixed(2)}</span>
                                {extraTotal > 0 && (
                                  <div className="text-xs text-muted-foreground">includes extra pay</div>
                                )}
                              </>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-center no-underline">
                          {payment.status === 'void' ? (
                            <Badge variant="outline" className="border-destructive/50 text-destructive no-underline">Void</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-accent text-accent-foreground">Paid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right no-underline" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {payment.status === 'paid' ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive h-8 w-8"
                                    onClick={() => handleVoidPayment(payment.id)}
                                    aria-label="Void payment"
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRestorePayment(payment.id)}
                                    aria-label="Restore payment"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>{payment.status === 'paid' ? 'Void' : 'Restore'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                    <span className="text-muted-foreground">Class Rate</span>
                    <span className="text-right">
                      ${selectedDetailPayment.hoursLogged > 0
                        ? (selectedDetailPayment.totalAmount / selectedDetailPayment.hoursLogged).toFixed(2)
                        : '0.00'}/class
                    </span>
                    
                    <span className="text-muted-foreground">Classes</span>
                    <span className="text-right">{selectedDetailPayment.hoursLogged}</span>
                  </>
                )}
                
                <span className="text-muted-foreground">Class Amount</span>
                <span className="text-right">${selectedDetailPayment.totalAmount.toFixed(2)}</span>
              </div>

              {(() => {
                const items = extrasByPayment(selectedDetailPayment.id);
                const extraTotal = sumExtras(items);
                return (
                  <>
                    {items.length > 0 && (
                      <div className="border-t pt-3 space-y-1.5">
                        <div className="text-sm font-medium">Extra Pay</div>
                        {items.map((e) => (
                          <div key={e.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {format(new Date(e.event_date), 'MM/dd/yyyy')}
                              {e.description ? ` — ${e.description}` : ''}
                            </span>
                            <span className="font-medium">${Number(e.amount).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold pt-1">
                          <span>Extra Pay Subtotal</span>
                          <span>${extraTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold">Grand Total</span>
                      <span className="text-lg font-bold">
                        ${(selectedDetailPayment.totalAmount + extraTotal).toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()}
              
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
            <DialogTitle>
              {generateScopedIds.length === 0
                ? 'Generate Pay Period — All Instructors'
                : generateScopedIds.length === 1
                  ? `Generate Pay Period — ${instructorsList.find(i => i.id === generateScopedIds[0])?.name ?? ''}`
                  : `Generate Pay Period — ${generateScopedIds.length} Instructors`}
            </DialogTitle>
            <DialogDescription>
              {generateStep === 'dates' 
                ? 'Select the pay period dates. The system will count scheduled classes from each instructor\'s weekly schedule and multiply by their class rate.'
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
                      <TableHead className="text-right">Class Rate</TableHead>
                      <TableHead className="text-right">Classes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedPayments.map((gp) => (
                      <TableRow key={gp.instructorId}>
                        <TableCell className="font-medium">{gp.instructorName}</TableCell>
                        <TableCell className="text-right">${gp.sessionFee}/class</TableCell>
                        <TableCell className="text-right">{gp.totalSessions}</TableCell>
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
            <DialogTitle>Edit Classes</DialogTitle>
            <DialogDescription>Add or subtract classes taught by the instructor</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={hoursOperation} onValueChange={(v) => setHoursOperation(v as 'add' | 'subtract')} className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add">Add Classes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subtract" id="subtract" />
                <Label htmlFor="subtract">Subtract Classes</Label>
              </div>
            </RadioGroup>
            <div className="grid gap-2">
              <Label htmlFor="hours">Classes to {hoursOperation === 'add' ? 'Add' : 'Subtract'}</Label>
              <Input id="hours" type="number" step="1" min="1" placeholder={`Enter classes to ${hoursOperation}`} value={hoursToChange} onChange={(e) => setHoursToChange(e.target.value)} />
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
            <DialogTitle>Update Class Rate</DialogTitle>
            <DialogDescription>
              {selectedInstructor && `Set the class rate for ${selectedInstructor.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sessionFee">Class Rate ($)</Label>
              <Input id="sessionFee" type="number" step="0.50" min="0" placeholder="e.g. 50" value={newSessionFee} onChange={(e) => setNewSessionFee(e.target.value)} />
              <p className="text-xs text-muted-foreground">Instructor earns this for each scheduled class slot — used by both the Pay Ledger and Generate Pay Period.</p>
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

      {/* Extra Pay dialog (replaces legacy single-bonus flow) */}
      <ExtraPayDialog
        open={showExtraPayDialog}
        onOpenChange={(o) => {
          setShowExtraPayDialog(o);
          if (!o) {
            setExtraPayPaymentId(null);
            setExtraPayInstructorId(null);
            setExtraPayInstructorName('');
          }
        }}
        paymentId={extraPayPaymentId}
        instructorId={extraPayInstructorId}
        instructorName={extraPayInstructorName}
        existing={extraPayPaymentId ? extrasByPayment(extraPayPaymentId) : []}
        onSaved={invalidate}
      />

      {/* Standalone Extra Pay (no payroll period) */}
      <Dialog open={showStandaloneExtra} onOpenChange={setShowStandaloneExtra}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Extra Pay</DialogTitle>
            <DialogDescription>
              Pay an instructor for one-off events or gigs without generating a full payroll period.
              This will appear in the pending payments list and can be marked Paid like any other payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="standalone-instructor" className="text-xs uppercase tracking-wide text-muted-foreground">
                Instructor
              </Label>
              <Select value={standaloneInstructorId} onValueChange={setStandaloneInstructorId}>
                <SelectTrigger id="standalone-instructor">
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructorsList.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Line items ({standaloneItems.length})
              </Label>
              {standaloneItems.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed rounded p-3 text-center">
                  No extra pay added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {standaloneItems.map(item => (
                    <div key={item._key} className="flex items-center gap-2 border rounded p-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.description || 'Extra pay'}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(item.event_date), 'MM/dd/yyyy')}
                        </div>
                      </div>
                      <div className="font-semibold whitespace-nowrap">
                        ${(parseFloat(item.amount) || 0).toFixed(2)}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeStandaloneItem(item._key)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-end text-sm font-semibold pt-1">
                    Total: ${standaloneTotal.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Add new line item
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="sa-date" className="text-xs">Date</Label>
                  <Input id="sa-date" type="date" value={standaloneNewDate} onChange={(e) => setStandaloneNewDate(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sa-amount" className="text-xs">Pay rate ($)</Label>
                  <Input id="sa-amount" type="number" step="0.01" min="0" placeholder="150.00" value={standaloneNewAmount} onChange={(e) => setStandaloneNewAmount(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sa-desc" className="text-xs">Description</Label>
                <Input id="sa-desc" value={standaloneNewDesc} onChange={(e) => setStandaloneNewDesc(e.target.value)} placeholder="e.g. Open-deck event at The Lot" />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addStandaloneItem}>
                <Plus className="h-4 w-4 mr-1" /> Add line item
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStandaloneExtra(false)} disabled={standaloneSaving}>Cancel</Button>
            <Button onClick={saveStandaloneExtra} disabled={standaloneSaving}>
              {standaloneSaving ? 'Saving...' : 'Save Extra Pay'}
            </Button>
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
