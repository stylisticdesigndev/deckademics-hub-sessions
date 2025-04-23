
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock } from "lucide-react";

interface InstructorPaymentStats {
  pendingPaymentsCount: number;
  totalPendingAmount: number;
  instructorRatesCount: number;
}

interface InstructorPaymentStatsCardsProps {
  stats: InstructorPaymentStats;
  instructors: Array<{ name: string; hourlyRate: number }>;
}

export const InstructorPaymentStatsCards = ({ stats, instructors }: InstructorPaymentStatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Payments
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingPaymentsCount}</div>
          <p className="text-xs text-muted-foreground">
            ${stats.totalPendingAmount} pending
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Instructor Hourly Rates
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            {instructors.slice(0, 3).map(instructor => (
              <div key={instructor.name} className="flex justify-between items-center">
                <span>{instructor.name}</span>
                <span className="font-semibold">${instructor.hourlyRate}/hr</span>
              </div>
            ))}
            {instructors.length > 3 && (
              <div className="text-xs text-muted-foreground text-right mt-1">
                +{instructors.length - 3} more instructors
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
