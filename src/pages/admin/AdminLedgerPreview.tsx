import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, Calendar as CalendarIcon, DollarSign, Eye, Info } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface MockRow {
  id: string;
  class_date: string;
  class_time: string;
  amount: number;
  paid: boolean;
  attendees: number;
}

const SESSION_FEE = 50;

const seedRows = (): MockRow[] => {
  const slots = ['5:00 PM', '6:30 PM', '8:00 PM'];
  const rows: MockRow[] = [];
  for (let i = 0; i < 14; i++) {
    const date = format(subDays(new Date(), i * 2), 'yyyy-MM-dd');
    const slot = slots[i % slots.length];
    rows.push({
      id: `mock-${i}`,
      class_date: date,
      class_time: slot,
      amount: SESSION_FEE,
      paid: i >= 6, // older entries marked paid
      attendees: (i % 4) + 1,
    });
  }
  return rows;
};

const AdminLedgerPreview = () => {
  const [rows, setRows] = useState<MockRow[]>(seedRows());

  const stats = useMemo(() => {
    const unpaid = rows.filter(r => !r.paid);
    const paid = rows.filter(r => r.paid);
    const sum = (xs: MockRow[]) => xs.reduce((a, r) => a + r.amount, 0);
    return {
      unpaidAmt: sum(unpaid),
      paidAmt: sum(paid),
      unpaidSessions: unpaid.length,
      totalSessions: rows.length,
    };
  }, [rows]);

  const markAllPaid = () => setRows(rs => rs.map(r => ({ ...r, paid: true })));
  const reset = () => setRows(seedRows());

  return (
    <div className="space-y-6">
      <section className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Pay Ledger — Preview (Nick)</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Temporary admin preview of the instructor Pay Ledger using mock data. Flat <strong>${SESSION_FEE}</strong> per scheduled time slot — once per slot regardless of attendee count.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>Reset Mock Data</Button>
          <Button onClick={markAllPaid}>Mark All Paid</Button>
        </div>
      </section>

      <Card className="border-dashed border-primary/40 bg-primary/5">
        <CardContent className="py-3 flex items-start gap-2 text-sm">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            This is a sandbox preview at <code className="px-1 rounded bg-muted">/admin/ledger-preview</code>. No data is written to the database. Use it to verify layout, stats math, and the Paid/Unpaid badge states that Nick will see on his ledger.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" /> Unpaid Balance</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${stats.unpaidAmt.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Unpaid Sessions</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.unpaidSessions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lifetime Paid</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${stats.paidAmt.toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Sessions ({rows.length})</CardTitle></CardHeader>
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
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{format(new Date(r.class_date), 'MM/dd/yyyy')}</TableCell>
                    <TableCell>{r.class_time}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{r.attendees} present</span>
                    </TableCell>
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
            ✅ Note the "Attendees" column — even when 4 students attend, the session fee stays at ${SESSION_FEE}. The instructor is paid once per slot.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLedgerPreview;