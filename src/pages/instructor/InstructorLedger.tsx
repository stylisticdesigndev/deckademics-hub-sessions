import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Calendar as CalendarIcon, DollarSign, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { format } from 'date-fns';
import { useInstructorPaymentExtras } from '@/hooks/useInstructorPaymentExtras';

interface LedgerRow {
  id: string;
  class_date: string;
  class_time: string | null;
  amount: number | null;
  payment_id: string | null;
  student_id: string;
  student_name?: string;
  pay_period_start?: string | null;
  pay_period_end?: string | null;
  payment_status?: 'pending' | 'paid' | 'void' | null;
}

const InstructorLedger = () => {
  const { session } = useAuth();
  const instructorId = session?.user?.id;
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { extras, sumExtras } = useInstructorPaymentExtras();

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('instructor_ledger_entries')
        .select('id, class_date, class_time, amount, payment_id, student_id')
        .eq('instructor_id', instructorId)
        .order('class_date', { ascending: false });

      if (data && data.length > 0) {
        const ids = Array.from(new Set(data.map(r => r.student_id)));
        const { data: profs } = await supabase
          .from('profiles').select('id, first_name, last_name').in('id', ids);
        const map = new Map((profs ?? []).map(p => [p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Student']));

        const paymentIds = Array.from(new Set(data.map(r => r.payment_id).filter(Boolean))) as string[];
        let payMap = new Map<string, { start: string; end: string; status: string }>();
        if (paymentIds.length > 0) {
          const { data: pays } = await supabase
            .from('instructor_payments')
            .select('id, pay_period_start, pay_period_end, status')
            .in('id', paymentIds);
          payMap = new Map((pays ?? []).map((p: any) => [p.id, { start: p.pay_period_start, end: p.pay_period_end, status: p.status }]));
        }

        setRows(data.map((r: any) => ({
          ...r,
          student_name: map.get(r.student_id),
          pay_period_start: r.payment_id ? payMap.get(r.payment_id)?.start ?? null : null,
          pay_period_end: r.payment_id ? payMap.get(r.payment_id)?.end ?? null : null,
          payment_status: r.payment_id ? (payMap.get(r.payment_id)?.status as any) ?? null : null,
        })));
      } else {
        setRows([]);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const stats = useMemo(() => {
    // Voided payments count as unpaid (the work still needs to be paid via a new payroll entry)
    const unpaid = rows.filter(r => !r.payment_id || r.payment_status === 'void');
    const paid = rows.filter(r => r.payment_id && r.payment_status !== 'void');
    const sum = (xs: LedgerRow[]) => xs.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const extraTotal = sumExtras(extras);
    return {
      unpaidAmt: sum(unpaid), paidAmt: sum(paid) + extraTotal,
      unpaidSessions: unpaid.length, totalSessions: rows.length,
      extraTotal,
      extraCount: extras.length,
    };
  }, [rows, extras, sumExtras]);

  return (
    <div className="space-y-6 w-full">
        <section>
          <h1 className="text-2xl font-bold">My Payment</h1>
          <p className="text-muted-foreground mt-1">Auto-generated from your marked attendance — flat fee per class session. You earn once per scheduled time slot, regardless of how many students attend.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" /> Unpaid Balance</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">${stats.unpaidAmt.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Unpaid Sessions</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.unpaidSessions}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lifetime Paid</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">${stats.paidAmt.toFixed(2)}</div></CardContent>
          </Card>
        </div>

        {extras.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Extra Pay
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                One-off events, gigs, and bonuses added by the school.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extras.map(e => (
                      <TableRow key={e.id}>
                        <TableCell>{format(new Date(e.event_date), 'MM/dd/yyyy')}</TableCell>
                        <TableCell className="text-sm">
                          {e.description || <span className="text-muted-foreground italic">No description</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium">${Number(e.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-3 flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total Extra Pay</span>
                  <span>${stats.extraTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">My Payment</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No ledger entries yet. Mark attendance to start earning.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pay Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => (
                      <TableRow key={r.id} className={r.payment_status === 'void' ? 'opacity-60 [&_td]:line-through' : ''}>
                        <TableCell>{format(new Date(r.class_date), 'MM/dd/yyyy')}</TableCell>
                        <TableCell>
                          {r.pay_period_start && r.pay_period_end
                            ? `${format(new Date(r.pay_period_start), 'MM/dd/yyyy')} – ${format(new Date(r.pay_period_end), 'MM/dd/yyyy')}`
                            : '—'}
                        </TableCell>
                        <TableCell className="no-underline">
                          {r.payment_status === 'void'
                            ? <Badge variant="outline" className="border-destructive/50 text-destructive no-underline">Void</Badge>
                            : r.payment_id
                              ? <Badge variant="outline" className="border-green-500/50 text-green-500">Paid</Badge>
                              : <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Unpaid</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default InstructorLedger;
