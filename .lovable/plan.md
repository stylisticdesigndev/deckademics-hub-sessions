

# Automate Instructor Payment Generation

## Problem
Currently the admin must manually create a payment record for each instructor one-by-one, entering hours by hand. This is tedious when there are multiple instructors.

## Solution: "Generate Pay Period" Button
Add a single action that auto-creates pending payment records for ALL active instructors at once, using their saved weekly schedules to calculate hours worked.

## How It Works

```text
Admin clicks "Generate Pay Period"
  -> Picks start date and end date
  -> System reads each instructor's weekly schedule (instructor_schedules table)
  -> Counts scheduled days that fall within the date range
  -> Calculates hours per day from time ranges (e.g. "2:00 PM - 5:00 PM" = 3 hrs)
  -> Creates one pending "class" payment per instructor with total hours & amount
  -> All payments appear in "Current Pay Period" section
  -> Admin reviews and adjusts: increase/decrease hours, add bonus payments
  -> Admin marks each as paid when ready
```

Example: If an instructor works Monday and Wednesday, 2:00-5:00 PM (3 hrs/day), and the pay period is 2 weeks, that's ~4 days x 3 hrs = 12 hours x hourly rate.

## Changes

### 1. New utility function: `calculateScheduledHours`
Parse instructor schedule entries and count how many scheduled days fall in a date range, then compute total hours from time strings.

### 2. Update `AdminInstructorPayments.tsx`
- Add "Generate Pay Period" button (prominent, next to existing buttons)
- New dialog with just start/end date pickers
- On submit: fetch all active instructors + their schedules, calculate hours for each, batch-create pending payments via `useCreateInstructorPayment`
- Skip instructors who already have a pending payment overlapping that period
- Show a summary before confirming (instructor name, calculated hours, amount)

### 3. Keep existing manual controls
- "Create Payment" button stays for one-off manual entries
- "Add Bonus Payment" stays as-is
- Edit hours (add/subtract) stays for adjustments after generation
- Mark as paid stays as-is

## Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminInstructorPayments.tsx` | Add "Generate Pay Period" button, dialog, and batch creation logic |
| `src/utils/scheduleHours.ts` (new) | Utility to parse schedule time ranges and count days in a period |

No database changes needed -- uses existing `instructor_schedules` and `instructor_payments` tables.

