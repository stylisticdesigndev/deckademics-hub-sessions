
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { PaymentStats } from "@/hooks/useAdminPayments";

interface PaymentStatsCardsProps {
  stats: PaymentStats;
}

export const PaymentStatsCards = ({ stats }: PaymentStatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Missed Payments
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.missedPaymentsCount}</div>
          <p className="text-xs text-muted-foreground">
            ${stats.totalMissedAmount} past due
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Payments
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingPaymentsCount}</div>
          <p className="text-xs text-muted-foreground">
            ${stats.totalUpcomingAmount} due within 2 weeks
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
