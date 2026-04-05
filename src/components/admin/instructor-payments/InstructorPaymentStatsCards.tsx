
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, TrendingUp } from "lucide-react";

export interface InstructorPaymentStats {
  pendingPaymentsCount: number;
  totalPendingAmount: number;
  totalPaidThisMonth: number;
  totalPaidAllTime: number;
}

interface InstructorPaymentStatsCardsProps {
  stats: InstructorPaymentStats;
}

export const InstructorPaymentStatsCards = ({ stats }: InstructorPaymentStatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Payroll This Period
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(stats.totalPendingAmount ?? 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingPaymentsCount ?? 0} pending payment{stats.pendingPaymentsCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Paid This Month
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(stats.totalPaidThisMonth ?? 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total paid this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Paid All Time
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(stats.totalPaidAllTime ?? 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Lifetime instructor payments
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
