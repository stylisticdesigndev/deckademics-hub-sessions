
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Payment } from "@/hooks/useAdminPayments";

interface PaymentsTableProps {
  title: string;
  description: string;
  payments: Payment[];
  onMarkAsPaid?: (paymentId: string, paymentType: 'full' | 'partial') => void;
  showActions?: boolean;
}

export const PaymentsTable = ({ 
  title,
  description,
  payments,
  onMarkAsPaid,
  showActions = true
}: PaymentsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.studentName}</TableCell>
                  <TableCell>{payment.email}</TableCell>
                  <TableCell>${payment.amount}</TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={showActions ? "destructive" : "outline"} className={!showActions ? "bg-green-500/10 text-green-500" : ""}>
                        {showActions ? `${payment.daysPastDue} days past due` : "Paid"}
                      </Badge>
                      {payment.partiallyPaid && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Partially Paid
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {showActions && onMarkAsPaid && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => onMarkAsPaid(payment.id, 'full')}
                        >
                          <Check className="h-3 w-3" />
                          Fully Paid
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => onMarkAsPaid(payment.id, 'partial')}
                        >
                          Partial
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No payments found matching your search.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
