import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Plus } from "lucide-react";
import { format, addWeeks, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCreatePayment } from "@/hooks/useCreatePayment";

const COURSE_LEVELS = [
  { value: "novice", label: "Novice", total: 330, weeks: 6, fullOnly: true },
  { value: "amateur", label: "Amateur", total: 660, weeks: 12, fullOnly: false },
  { value: "intermediate", label: "Intermediate", total: 660, weeks: 12, fullOnly: false },
  { value: "advanced", label: "Advanced", total: 330, weeks: 6, fullOnly: false },
  { value: "advanced_plus", label: "Advanced Plus", total: 0, weeks: 0, fullOnly: false },
] as const;

const formSchema = z.object({
  student_id: z.string().uuid({ message: "Please select a student" }),
  course_level: z.string().min(1, { message: "Please select a course level" }),
  payment_schedule: z.enum(["full", "biweekly", "weekly"]),
  amount: z.string().min(1, { message: "Amount is required" }),
  start_date: z.date({ required_error: "Start date is required" }),
  status: z.enum(["pending", "completed", "partial", "failed", "refunded"]),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePaymentDialogProps {
  students: Array<{ id: string; first_name: string; last_name: string }>;
}

export function CreatePaymentDialog({ students }: CreatePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const { createPayment, isPending } = useCreatePayment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "pending",
      payment_schedule: "full",
      description: "",
      amount: "",
    },
  });

  const courseLevel = form.watch("course_level");
  const paymentSchedule = form.watch("payment_schedule");

  const selectedCourse = COURSE_LEVELS.find(c => c.value === courseLevel);

  // Auto-set schedule for novice and calculate amount
  useEffect(() => {
    if (!selectedCourse) return;

    if (selectedCourse.fullOnly) {
      form.setValue("payment_schedule", "full");
    }

    if (selectedCourse.value === "advanced_plus") return;

    const total = selectedCourse.total;
    const weeks = selectedCourse.weeks;
    let amount: number;

    if (paymentSchedule === "full") {
      amount = total;
    } else if (paymentSchedule === "biweekly") {
      amount = Math.round((total / (weeks / 2)) * 100) / 100;
    } else {
      amount = Math.round((total / weeks) * 100) / 100;
    }

    form.setValue("amount", amount.toString());
  }, [courseLevel, paymentSchedule, selectedCourse, form]);

  const getInstallmentCount = (): number => {
    if (!selectedCourse || selectedCourse.value === "advanced_plus") return 1;
    if (paymentSchedule === "full") return 1;
    if (paymentSchedule === "biweekly") return selectedCourse.weeks / 2;
    return selectedCourse.weeks; // weekly
  };

  const onSubmit = async (data: FormValues) => {
    const installments = getInstallmentCount();
    const amount = parseFloat(data.amount);
    const levelLabel = selectedCourse?.label || data.course_level;

    if (installments === 1) {
      await createPayment({
        student_id: data.student_id,
        amount,
        payment_date: data.start_date.toISOString(),
        payment_type: "tuition",
        status: data.status,
        description: data.description || `${levelLabel} - Pay in Full`,
      });
    } else {
      const records = Array.from({ length: installments }, (_, i) => {
        const dueDate = paymentSchedule === "biweekly"
          ? addWeeks(data.start_date, i * 2)
          : addWeeks(data.start_date, i);
        const scheduleLabel = paymentSchedule === "biweekly" ? "Biweekly" : "Weekly";
        return {
          student_id: data.student_id,
          amount,
          payment_date: dueDate.toISOString(),
          payment_type: "tuition",
          status: "pending" as const,
          description: data.description || `${levelLabel} - ${scheduleLabel} (${i + 1} of ${installments})`,
        };
      });
      await createPayment(records);
    }

    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Payment</DialogTitle>
          <DialogDescription>
            Add a payment record based on course level and schedule
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Student */}
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course Level */}
            <FormField
              control={form.control}
              name="course_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      {COURSE_LEVELS.map((course) => (
                        <SelectItem key={course.value} value={course.value}>
                          {course.label}
                          {course.total > 0 && ` ($${course.total}/${course.weeks}wk)`}
                          {course.value === "advanced_plus" && " (Custom)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Schedule */}
            {selectedCourse && !selectedCourse.fullOnly && (
              <FormField
                control={form.control}
                name="payment_schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Schedule</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        <SelectItem value="full">Pay in Full</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    {paymentSchedule !== "full" && selectedCourse.total > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getInstallmentCount()} payments will be generated
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount ($)
                    {paymentSchedule !== "full" && selectedCourse && selectedCourse.total > 0 && " per installment"}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Auto-generated if left blank..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : paymentSchedule !== "full" && selectedCourse && !selectedCourse.fullOnly && selectedCourse.total > 0
                  ? `Create ${getInstallmentCount()} Payments`
                  : "Create Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
