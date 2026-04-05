# Fix Student Names + Explain Upcoming Payments

## 1. Student Names Not Showing

**Root cause**: The Supabase query joins `payments → students → profiles`, but there's no foreign key relationship between `students` and `profiles` tables. Supabase can't resolve the nested join `students:student_id ( profiles(...) )`.

Since `payments.student_id` and `profiles.id` are both the user's auth UUID, we can join `profiles` directly.

**Fix in `src/hooks/useAdminPayments.ts**`:

Change the query from:

```
students:student_id (
  id,
  profiles(first_name, last_name, email)
)
```

To:

```
profiles:student_id (
  first_name,
  last_name,
  email
)
```

Then simplify the data extraction -- instead of navigating `students.profiles[0]`, read directly from `profiles`:

```ts
const profile = safelyAccessProperty(payment, 'profiles');
const firstName = profile?.first_name || '';
const lastName = profile?.last_name || '';
const email = profile?.email || '';
```

Remove the `StudentsData` interface since it's no longer needed.

This fix applies to all three tabs (Pending, Upcoming, All Payments) since they all use the same `payments` data source.

## 2. How "Upcoming Payments" Works

Currently, there is **no automated logic**. Here's how it works:

- The admin manually creates a payment record (via "Create Payment") with a **future date** and status `pending`
- The code splits pending payments into two buckets:
  - `payment_date < today` → shows in **Pending** tab (overdue)
  - `payment_date >= today` → shows in **Upcoming** tab (not yet due)
- There is **no notification** sent to instructors or students about upcoming payments
- It's purely a visual dashboard tool for the admin to track what's coming up

If you want upcoming payments to be useful, we could later add: automatic recurring payment generation, or notifications to students when a payment is approaching its due date.

Please add automatic recurring payment generation, or notifications to students when a payment is approaching its due date.

## Files Changed


| File                            | Change                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/hooks/useAdminPayments.ts` | Fix query to join `profiles` directly instead of through `students`; simplify data extraction |
