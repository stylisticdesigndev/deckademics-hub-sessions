import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { format } from 'date-fns';

interface LedgerRow {
  id: string;
  class_date: string;
  class_time: string | null;
  amount: number | null;
  payment_id: string | null;
  student_id: string;
  student_name?: string;
}

const InstructorLedger = () => {
  const { session } = useAuth();
  const instructorId = session?.user?.id;
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

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
        setRows(data.map((r: any) => ({ ...r, student_name: map.get(r.student_id) })));
      } else {
        setRows([]);
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const stats = useMemo(() => {
    const unpaid = rows.filter(r => !r.payment_id);
    const paid = rows.filter(r => r.payment_id);
    const sum = (xs: LedgerRow[]) => xs.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    return {
      unpaidAmt: sum(unpaid), paidAmt: sum(paid),
      unpaidSessions: unpaid.length, totalSessions: rows.length,
    };
  }, [rows]);

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Pay Ledger</h1>
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

        <Card>
          <CardHeader><CardTitle className="text-lg">Sessions</CardTitle></CardHeader>
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
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Session Fee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{format(new Date(r.class_date), 'MM/dd/yyyy')}</TableCell>
                        <TableCell>{r.class_time || '—'}</TableCell>
                        <TableCell className="font-medium">${Number(r.amount ?? 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {r.payment_id
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
    </DashboardLayout>
  );
};

export default InstructorLedger;
