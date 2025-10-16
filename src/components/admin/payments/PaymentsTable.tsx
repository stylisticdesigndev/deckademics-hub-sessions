
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Payment } from "@/hooks/useAdminPayments";
import { EditPaymentDialog } from "./EditPaymentDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useDeletePayment } from "@/hooks/useDeletePayment";

interface PaymentsTableProps {
  title: string;
  description: string;
  payments: Payment[];
  onMarkAsPaid?: (paymentId: string, paymentType: 'full' | 'partial') => void;
  showActions?: boolean;
  showEditDelete?: boolean;
  students?: Array<{ id: string; first_name: string; last_name: string }>;
}

export const PaymentsTable = ({ 
  title,
  description,
  payments,
  onMarkAsPaid,
  showActions = true,
  showEditDelete = false,
  students = []
}: PaymentsTableProps) => {
  const { deletePayment } = useDeletePayment();
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {(showActions || showEditDelete) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.studentName}</TableCell>
                  <TableCell>{payment.email}</TableCell>
                  <TableCell>${payment.amount}</TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell className="capitalize">{payment.paymentType}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        payment.status === 'completed' ? 'default' :
                        payment.status === 'pending' ? 'secondary' :
                        payment.status === 'failed' ? 'destructive' : 'outline'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  {showActions && onMarkAsPaid && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => onMarkAsPaid(payment.id, 'full')}
                        >
                          <Check className="h-3 w-3" />
                          Mark Paid
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  {showEditDelete && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EditPaymentDialog payment={payment} students={students} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this payment for {payment.studentName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePayment(payment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
