

# Rebuild Instructor Payments: Pay Period Workflow

## Current State

The `instructor_payments` table has: `id`, `instructor_id`, `amount`, `status` (pending/paid), `hours_worked`, `payment_date`, `description`. But there's no way to create payments from the UI, no real pay period dates, and no concept of "bonus/extra" payments.

## Plan

### 1. Database Migration

Add columns to `instructor_payments`:
- `pay_period_start` (date, NOT NULL)
- `pay_period_end` (date, NOT NULL)
- `payment_type` (text, NOT NULL, default `'class'`) -- values: `'class'` or `'bonus'`

Backfill existing rows with `payment_date` for both start/end and `'class'` for type.

### 2. Rework the Page Layout

The page will have these sections:

**Stats Cards** -- keep existing, add "Total Paid This Month" card.

**Instructor Rates** -- keep as-is (set hourly rates).

**Create Pay Period Payment** -- new section with a "Create Payment" button that opens a dialog:
- Select instructor (dropdown)
- Pay period start date and end date (date pickers)
- Hours worked (number input)
- Amount auto-calculates from hours x hourly rate (editable override)
- Type defaults to "class"

**Create Bonus Payment** -- a separate "Add Bonus Payment" button (or a toggle in the same dialog):
- Select instructor
- Amount (manual entry)
- Description (text field for "Extra class", "Event DJ", etc.)
- Date
- Type = "bonus"

**Current Pay Period** -- shows all `pending` payments, grouped by instructor. Each row shows:
- Instructor name
- Type (Class / Bonus with description)
- Hours (for class type) or Description (for bonus type)
- Rate, Amount
- Actions: Edit Hours, Mark Paid

**Payment History** -- shows all `paid` payments with proper pay period start/end dates, type badge, and description.

### 3. Hook Updates

Update `useInstructorPayments.ts`:
- Fetch `pay_period_start`, `pay_period_end`, `payment_type`, `description` from query
- Add these to the `InstructorPayment` interface
- Remove the hack of using `payment_date` for both start/end

Create a new `useCreateInstructorPayment.ts` hook for inserting payments.

### 4. UI Component Changes

**`AdminInstructorPayments.tsx`**:
- Add "Create Payment" and "Add Bonus Payment" buttons in the header area
- New dialog for creating class payments (instructor select, date range, hours, auto-calc amount)
- New dialog for creating bonus payments (instructor select, amount, description, date)
- Update pending table to show payment type badge and description column
- Update history table to show real pay period dates and type

**`InstructorPaymentStatsCards.tsx`**:
- Add a third card showing total paid amount for the current month

### 5. Flow Summary

```text
Admin creates payment record (class or bonus)
  -> Appears in "Current Pay Period" as pending
  -> Admin can edit hours / amount
  -> Admin clicks "Mark Paid"
  -> Moves to "Payment History" with full details
```

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Add `pay_period_start`, `pay_period_end`, `payment_type` columns |
| `src/hooks/useInstructorPayments.ts` | Fetch new columns, update interface |
| New: `src/hooks/useCreateInstructorPayment.ts` | Insert mutation hook |
| `src/pages/admin/AdminInstructorPayments.tsx` | Add create dialogs, update tables |
| `src/components/admin/instructor-payments/InstructorPaymentStatsCards.tsx` | Add third stat card |

