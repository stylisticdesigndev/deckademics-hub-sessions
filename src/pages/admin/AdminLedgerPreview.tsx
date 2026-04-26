import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import {
  Wallet, Calendar as CalendarIcon, DollarSign, Eye, Info, Search,
  CreditCard, Plus, Edit, Trash2, CheckCircle2,
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

// ────────────────────────────────────────────────────────────
// MOCK DATA TYPES
// ────────────────────────────────────────────────────────────
interface LedgerRow {
  id: string;
  class_date: string;
  class_time: string;
  amount: number;
  paid: boolean;
  attendees: number;
}

interface StudentPayment {
  id: string;
  studentName: string;
  email: string;
  amount: number;
  status: 'pending' | 'completed' | 'upcoming';
  payment_date: string;
  description: string;
}

interface InstructorPayrollRecord {
  id: string;
  instructorName: string;
  pay_period_start: string;
  pay_period_end: string;
  hours_worked: number;
  amount: number;
  bonus_amount: number;
  status: 'pending' | 'paid';
  payment_date: string;
}

const SESSION_FEE = 50;

// ────────────────────────────────────────────────────────────
// SEED DATA
// ────────────────────────────────────────────────────────────
const seedLedger = (): LedgerRow[] => {
  const slots = ['5:00 PM', '6:30 PM', '8:00 PM'];
  const rows: LedgerRow[] = [];
  for (let i = 0; i < 14; i++) {
    const date = format(subDays(new Date(), i * 2), 'yyyy-MM-dd');
    const slot = slots[i % slots.length];
    rows.push({
      id: `ledger-${i}`,
      class_date: date,
      class_time: slot,
      amount: SESSION_FEE,
      paid: i >= 6,
      attendees: (i % 4) + 1,
    });
  }
  return rows;
};

const seedStudentPayments = (): StudentPayment[] => {
  const names = [
    ['Alex', 'Reyes', 'alex.r@example.com'],
    ['Jordan', 'Pak', 'jordan.p@example.com'],
    ['Sam', 'Brooks', 'sam.b@example.com'],
    ['Taylor', 'Kim', 'taylor.k@example.com'],
    ['Morgan', 'Diaz', 'morgan.d@example.com'],
    ['Riley', 'Chen', 'riley.c@example.com'],
  ];
  const payments: StudentPayment[] = [];
  names.forEach((n, i) => {
    payments.push({
      id: `sp-pending-${i}`, studentName: `${n[0]} ${n[1]}`, email: n[2],
      amount: 350, status: 'pending',
      payment_date: format(subDays(new Date(), 5 + i), 'yyyy-MM-dd'),
      description: 'Monthly Tuition (Novice)',
    });
    if (i < 4) payments.push({
      id: `sp-up-${i}`, studentName: `${n[0]} ${n[1]}`, email: n[2],
      amount: 350, status: 'upcoming',
      payment_date: format(addDays(new Date(), 7 + i * 2), 'yyyy-MM-dd'),
      description: 'Next Installment',
    });
    if (i < 5) payments.push({
      id: `sp-paid-${i}`, studentName: `${n[0]} ${n[1]}`, email: n[2],
      amount: 350, status: 'completed',
      payment_date: format(subDays(new Date(), 30 + i * 5), 'yyyy-MM-dd'),
      description: 'Monthly Tuition',
    });
  });
  return payments;
};

const seedInstructorPayroll = (): InstructorPayrollRecord[] => {
  const instructors = ['Nick Saligoe', 'Ben Wallace', 'Master Roshi', 'King Ki'];
  const out: InstructorPayrollRecord[] = [];
  instructors.forEach((name, i) => {
    for (let p = 0; p < 3; p++) {
      const start = subDays(new Date(), (p + 1) * 14);
      const end = subDays(start, -13);
      out.push({
        id: `ip-${i}-${p}`,
        instructorName: name,
        pay_period_start: format(start, 'yyyy-MM-dd'),
        pay_period_end: format(end, 'yyyy-MM-dd'),
        hours_worked: 12 + (i + p) * 1.5,
        amount: (12 + (i + p) * 1.5) * SESSION_FEE,
        bonus_amount: p === 0 && i === 0 ? 100 : 0,
        status: p === 0 ? 'pending' : 'paid',
        payment_date: format(end, 'yyyy-MM-dd'),
      });
    }
  });
  return out;
};

// ────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────
const AdminLedgerPreview = () => {
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>(seedLedger());
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>(seedStudentPayments());
  const [payrollRecords, setPayrollRecords] = useState<InstructorPayrollRecord[]>(seedInstructorPayroll());
  const [search, setSearch] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');

  // Real active instructors (read-only fetch, used to populate dropdown + rate editor)
  const [activeInstructors, setActiveInstructors] = useState<{
    id: string; name: string; email: string; sessionFee: number; hourlyRate: number;
  }[]>([]);

  // Local mock overrides for session fee per instructor (does NOT save to DB)
  const [feeOverrides, setFeeOverrides] = useState<Record<string, number>>({});
  const [rateDialogFor, setRateDialogFor] = useState<string | null>(null);
  const [rateDialogFee, setRateDialogFee] = useState('');
  const [rateDialogHourly, setRateDialogHourly] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, hourly_rate, session_fee, profiles (first_name, last_name, email)')
        .eq('status', 'active' as any);
      if (error) {
        console.error('Preview: failed to fetch instructors', error);
        return;
      }
      const list = (data || []).map((inst: any) => ({
        id: inst.id,
        name: `${inst.profiles?.first_name || ''} ${inst.profiles?.last_name || ''}`.trim() || 'Unknown',
        email: inst.profiles?.email || '',
        sessionFee: typeof inst.session_fee === 'number' ? inst.session_fee : 50,
        hourlyRate: inst.hourly_rate || 0,
      }));
      setActiveInstructors(list);
    })();
  }, []);

  const getEffectiveFee = (id: string, fallback: number) =>
    feeOverrides[id] ?? fallback;

  const openRateDialog = (id: string) => {
    const inst = activeInstructors.find(i => i.id === id);
    if (!inst) return;
    setRateDialogFor(id);
    setRateDialogFee(getEffectiveFee(id, inst.sessionFee).toString());
    setRateDialogHourly(inst.hourlyRate.toString());
  };

  const saveRateDialog = () => {
    if (!rateDialogFor) return;
    const fee = parseFloat(rateDialogFee);
    if (isNaN(fee) || fee < 0) {
      alert('Enter a valid flat fee.');
      return;
    }
    setFeeOverrides(prev => ({ ...prev, [rateDialogFor]: fee }));
    alert(`▶︎ Mock: Updated fee to $${fee}/class for this preview only. Nothing was saved to the database.`);
    setRateDialogFor(null);
  };

  const ledgerStats = useMemo(() => {
    const unpaid = ledgerRows.filter(r => !r.paid);
    const paid = ledgerRows.filter(r => r.paid);
    const sum = (xs: LedgerRow[]) => xs.reduce((a, r) => a + r.amount, 0);
    return {
      unpaidAmt: sum(unpaid),
      paidAmt: sum(paid),
      unpaidSessions: unpaid.length,
      totalSessions: ledgerRows.length,
    };
  }, [ledgerRows]);

  const studentStats = useMemo(() => {
    const pending = studentPayments.filter(p => p.status === 'pending');
    const upcoming = studentPayments.filter(p => p.status === 'upcoming');
    return {
      missedPaymentsCount: pending.length,
      totalMissedAmount: pending.reduce((a, p) => a + p.amount, 0),
      upcomingPaymentsCount: upcoming.length,
      totalUpcomingAmount: upcoming.reduce((a, p) => a + p.amount, 0),
    };
  }, [studentPayments]);

  // Use real active instructors for the dropdown; fall back to seeded names if fetch hasn't returned yet
  const instructorDropdown = useMemo(() => {
    if (activeInstructors.length > 0) {
      return activeInstructors.map(i => ({ id: i.id, name: i.name }));
    }
    return Array.from(new Set(payrollRecords.map(p => p.instructorName))).map(n => ({ id: n, name: n }));
  }, [activeInstructors, payrollRecords]);

  const filterStudent = (list: StudentPayment[]) =>
    list.filter(p =>
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    );

  // Mock action handlers
  const markLedgerAllPaid = () => setLedgerRows(rs => rs.map(r => ({ ...r, paid: true })));
  const resetAll = () => {
    setLedgerRows(seedLedger());
    setStudentPayments(seedStudentPayments());
    setPayrollRecords(seedInstructorPayroll());
  };
  const markStudentPaid = (id: string) =>
    setStudentPayments(ps => ps.map(p => p.id === id ? { ...p, status: 'completed' as const } : p));
  const generateAll = () => {
    alert('▶︎ Mock: Would generate payroll for ALL active instructors based on attendance ledger.');
  };
  const generateIndividual = () => {
    if (!selectedInstructor) return alert('Pick an instructor first.');
    const inst = activeInstructors.find(i => i.id === selectedInstructor);
    const name = inst?.name ?? selectedInstructor;
    alert(`▶︎ Mock: Would generate payroll for ${name} based on their unpaid ledger entries.`);
  };
  const markPayrollPaid = (id: string) =>
    setPayrollRecords(ps => ps.map(p => p.id === id ? { ...p, status: 'paid' as const } : p));

  return (
    <div className="space-y-6">
      <section className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Payments — Preview (Nick's Full View)</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Sandbox of every payment screen Nick has access to. Mock data only — nothing writes to the database.
          </p>
        </div>
        <Button variant="outline" onClick={resetAll}>Reset All Mock Data</Button>
      </section>

      <Card className="border-dashed border-primary/40 bg-primary/5">
        <CardContent className="py-3 flex items-start gap-2 text-sm">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            Sandbox preview at <code className="px-1 rounded bg-muted">/admin/ledger-preview</code>. Mirrors all 3 of Nick's payment screens with mock data. Buttons trigger mock alerts — nothing persists.
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="student-payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student-payments"><CreditCard className="h-4 w-4 mr-2" /> Student Payments</TabsTrigger>
          <TabsTrigger value="instructor-payments"><DollarSign className="h-4 w-4 mr-2" /> Instructor Payments</TabsTrigger>
          <TabsTrigger value="ledger"><Wallet className="h-4 w-4 mr-2" /> Pay Ledger (Instructor View)</TabsTrigger>
        </TabsList>

        {/* ──────────── TAB 1: STUDENT PAYMENTS ──────────── */}
        <TabsContent value="student-payments" className="space-y-4 mt-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Payment Management</h2>
              <p className="text-sm text-muted-foreground">Track and manage student payments</p>
            </div>
            <Button onClick={() => alert('▶︎ Mock: Would open Create Payment dialog')}>
              <Plus className="h-4 w-4 mr-2" /> Create Payment
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missed Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentStats.missedPaymentsCount}</div>
                <p className="text-xs text-muted-foreground">${studentStats.totalMissedAmount} past due</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentStats.upcomingPaymentsCount}</div>
                <p className="text-xs text-muted-foreground">${studentStats.totalUpcomingAmount} due within 2 weeks</p>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student, email, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({filterStudent(studentPayments.filter(p => p.status === 'pending')).length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({filterStudent(studentPayments.filter(p => p.status === 'upcoming')).length})</TabsTrigger>
              <TabsTrigger value="all">All Payments ({filterStudent(studentPayments).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <StudentPaymentsTable
                title="Pending Payments"
                description="Students with pending payments"
                payments={filterStudent(studentPayments.filter(p => p.status === 'pending'))}
                onMarkPaid={markStudentPaid}
              />
            </TabsContent>
            <TabsContent value="upcoming">
              <StudentPaymentsTable
                title="Upcoming Payments"
                description="Scheduled future payments"
                payments={filterStudent(studentPayments.filter(p => p.status === 'upcoming'))}
              />
            </TabsContent>
            <TabsContent value="all">
              <StudentPaymentsTable
                title="All Payments"
                description="Complete payment history with full management"
                payments={filterStudent(studentPayments)}
                showEditDelete
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ──────────── TAB 2: INSTRUCTOR PAYMENTS ──────────── */}
        <TabsContent value="instructor-payments" className="space-y-4 mt-4">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">Instructor Payroll</h2>
              <p className="text-sm text-muted-foreground">Generate and manage payroll for active instructors</p>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pick instructor..." />
                </SelectTrigger>
                <SelectContent>
                  {instructorDropdown.length === 0 ? (
                    <SelectItem value="__none__" disabled>No active instructors</SelectItem>
                  ) : (
                    instructorDropdown.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={generateIndividual}>
                <Plus className="h-4 w-4 mr-1" /> Generate Individual
              </Button>
              <Button onClick={generateAll}>
                <Plus className="h-4 w-4 mr-1" /> Generate All
              </Button>
            </div>
          </div>

          {/* Instructor Rates editor — mirrors Nick's Instructor Rates card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructor Rates</CardTitle>
              <CardDescription>
                Update the per-class flat fee and hourly rate. <strong>Preview only — changes are local and not saved.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeInstructors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading active instructors…</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Flat Fee / Class</TableHead>
                        <TableHead className="text-right">Hourly Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeInstructors.map(inst => {
                        const fee = getEffectiveFee(inst.id, inst.sessionFee);
                        const overridden = feeOverrides[inst.id] !== undefined;
                        return (
                          <TableRow key={inst.id}>
                            <TableCell className="font-medium">{inst.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{inst.email}</TableCell>
                            <TableCell className="text-right">
                              ${fee}/class
                              {overridden && <Badge variant="secondary" className="ml-2">preview</Badge>}
                            </TableCell>
                            <TableCell className="text-right">${inst.hourlyRate}/hr</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openRateDialog(inst.id)}>
                                Update Rates
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payroll History</CardTitle>
              <CardDescription>{payrollRecords.length} payroll records across {instructorDropdown.length} instructors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Pay Period</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.instructorName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(r.pay_period_start), 'MM/dd')} – {format(new Date(r.pay_period_end), 'MM/dd/yyyy')}
                        </TableCell>
                        <TableCell>{r.hours_worked}</TableCell>
                        <TableCell>{r.bonus_amount > 0 ? `$${r.bonus_amount.toFixed(2)}` : '—'}</TableCell>
                        <TableCell className="font-bold">${(r.amount + r.bonus_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          {r.status === 'paid'
                            ? <Badge variant="outline" className="border-green-500/50 text-green-500">Paid</Badge>
                            : <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Pending</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => markPayrollPaid(r.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── TAB 3: PAY LEDGER (instructor view) ──────────── */}
        <TabsContent value="ledger" className="space-y-4 mt-4">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">Pay Ledger — Instructor View</h2>
              <p className="text-sm text-muted-foreground">
                What an instructor sees: flat <strong>${SESSION_FEE}</strong> per scheduled slot, paid once per slot regardless of attendee count.
              </p>
            </div>
            <Button onClick={markLedgerAllPaid}>Mark All Paid</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" /> Unpaid Balance</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${ledgerStats.unpaidAmt.toFixed(2)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Unpaid Sessions</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{ledgerStats.unpaidSessions}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lifetime Paid</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${ledgerStats.paidAmt.toFixed(2)}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Sessions ({ledgerRows.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Session Fee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerRows.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{format(new Date(r.class_date), 'MM/dd/yyyy')}</TableCell>
                        <TableCell>{r.class_time}</TableCell>
                        <TableCell><span className="text-muted-foreground">{r.attendees} present</span></TableCell>
                        <TableCell className="font-medium">${r.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {r.paid
                            ? <Badge variant="outline" className="border-green-500/50 text-green-500">Paid</Badge>
                            : <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Unpaid</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                ✅ Even when multiple students attend, the session fee stays at ${SESSION_FEE} — the instructor is paid once per slot.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// SUB-COMPONENT: Student Payments Table
// ────────────────────────────────────────────────────────────
interface StudentPaymentsTableProps {
  title: string;
  description: string;
  payments: StudentPayment[];
  onMarkPaid?: (id: string) => void;
  showEditDelete?: boolean;
}

const StudentPaymentsTable = ({ title, description, payments, onMarkPaid, showEditDelete }: StudentPaymentsTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No payments to show.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.studentName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="font-medium">${p.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(p.payment_date), 'MM/dd/yyyy')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.description}</TableCell>
                  <TableCell>
                    {p.status === 'completed' && <Badge variant="outline" className="border-green-500/50 text-green-500">Paid</Badge>}
                    {p.status === 'pending' && <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Pending</Badge>}
                    {p.status === 'upcoming' && <Badge variant="outline" className="border-blue-500/50 text-blue-500">Upcoming</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {onMarkPaid && p.status === 'pending' && (
                      <Button size="sm" variant="ghost" onClick={() => onMarkPaid(p.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Paid
                      </Button>
                    )}
                    {showEditDelete && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => alert(`▶︎ Mock: Edit ${p.studentName}'s payment`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => alert(`▶︎ Mock: Delete ${p.studentName}'s payment`)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);

export default AdminLedgerPreview;