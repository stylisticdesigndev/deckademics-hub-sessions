

# Revamp Student Payment Creation + Fix Data Display

## Two issues to address

1. **Payments data not showing** (ongoing bug): The `payments` table has no foreign keys, so PostgREST nested joins fail silently. Need to either add a FK or use a two-query approach.

2. **Create Payment dialog needs to reflect actual school pricing**: Replace generic form with course-aware payment creation that understands levels, pricing, and payment schedules.

## School Pricing Structure

| Level | Duration | Total | Payment Options |
|-------|----------|-------|-----------------|
| Novice | 6 weeks | $330 | Pay in full only |
| Amateur | 12 weeks | $660 | Full, biweekly ($55/2wk), weekly ($55/wk) |
| Intermediate | 12 weeks | $660 | Full, biweekly, weekly |
| Advanced | 6 weeks | $330 | Full, biweekly, weekly |
| Advanced Plus | Optional | TBD | Full, biweekly, weekly |

## Plan

### Step 1: Fix payments query (DB migration)

Add a foreign key from `payments.student_id` to `profiles.id` so PostgREST can resolve the join. This fixes the blank data issue across all three tabs.

```sql
ALTER TABLE payments
  ADD CONSTRAINT payments_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

Then simplify the query in `useAdminPayments.ts` to:
```
profiles:student_id ( first_name, last_name, email )
```

And read directly from `profiles` without the nested `students` intermediary.

### Step 2: Add "partial" status (DB migration)

Update the `payments.status` check constraint (if one exists) or just allow "partial" as a valid status value in code. Add it to the form and display logic.

### Step 3: Redesign CreatePaymentDialog

Replace the current generic form with a course-aware flow:

1. **Select Student** -- same as now, but also show student's current level next to their name
2. **Select Course Level** -- dropdown: Novice ($330/6wk), Amateur ($660/12wk), Intermediate ($660/12wk), Advanced ($330/6wk), Advanced Plus (custom)
3. **Payment Schedule** -- conditionally shown:
   - Novice: "Pay in Full" only (auto-selected, no dropdown)
   - All others: dropdown with "Pay in Full", "Biweekly", "Weekly"
4. **Amount** -- auto-calculated based on course + schedule selection:
   - Full: total amount
   - Biweekly: total / (weeks / 2) per installment
   - Weekly: total / weeks per installment
   - Editable override for adjustments
5. **Start Date** -- single date picker for when the payment plan begins
6. **Status** -- pending, completed, partial, failed, refunded
7. **Description** -- optional, auto-populated with e.g. "Amateur - Biweekly (1 of 6)"

When a payment schedule (biweekly/weekly) is selected, clicking "Create" generates ALL installment records at once with future dates, each marked "pending". For "pay in full", a single record is created.

### Step 4: Update useCreatePayment hook

Support creating multiple payment records in a single batch insert for installment plans.

### Step 5: Update status options everywhere

Add "partial" to the status enum in:
- `CreatePaymentDialog` form schema
- `EditPaymentDialog` (if it has status)
- `PaymentsTable` badge rendering
- `useCreatePayment` type definition

## Files Changed

| File | Change |
|------|--------|
| DB migration | Add FK `payments.student_id → profiles.id`; no status constraint change needed (column is plain text) |
| `src/hooks/useAdminPayments.ts` | Simplify query to use `profiles:student_id(...)` directly; add "partial" to type |
| `src/components/admin/payments/CreatePaymentDialog.tsx` | Full redesign: course level selector, payment schedule logic, auto-amount calculation, batch installment creation |
| `src/hooks/useCreatePayment.ts` | Support batch insert for installment plans; add "partial" to status type |
| `src/components/admin/payments/PaymentsTable.tsx` | Add "partial" badge styling |
| `src/components/admin/payments/EditPaymentDialog.tsx` | Add "partial" status option |

