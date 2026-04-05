
# Fix payments not loading after create

## What is actually happening
- The payment is being saved. The database already contains the recently created payment rows.
- The page is blank because the fetch in `src/hooks/useAdminPayments.ts` is failing, and that hook shows the toast: “Failed to fetch payments.”

## Root cause
Do I know what the issue is? Yes.

The payments query is using an embedded join that is now brittle/ambiguous:

```ts
profiles:student_id (
  first_name,
  last_name,
  email
)
```

`payments.student_id` currently has multiple foreign-key paths, so PostgREST/Supabase can’t safely infer which relationship to use unless the query explicitly chooses one with `!foreign_key`, or the app avoids the embedded join entirely.

There is also a second bug in the same area:
- the UI now offers status `partial`
- the database constraint still only allows `pending`, `completed`, `failed`, `refunded`

## Plan

### 1. Make the payments fetch stable
Refactor `src/hooks/useAdminPayments.ts` to use a two-step fetch instead of the fragile embedded join:

1. Fetch `payments` only
2. Collect unique `student_id` values
3. Fetch related student/profile data separately using the same `students -> profiles` pattern that already works elsewhere in the app
4. Merge the results in memory

Recommended shape:
```ts
payments: select(id, amount, payment_date, payment_type, status, description, student_id)

students: select(
  id,
  profiles(first_name, last_name, email)
).in('id', studentIds)
```

Why this is the safest fix:
- avoids PostgREST foreign-key ambiguity
- avoids blanking the whole screen because of one bad relation
- reuses an already-working query pattern from `useAdminStudents`

### 2. Clean up the schema that caused the ambiguity
Create a migration to remove the extra `payments_student_id_profiles_fkey` relationship if it is not intentionally needed.

Keep one canonical relationship:
- `payments.student_id -> students.id`

That matches the rest of the app’s data model and prevents future join confusion.

### 3. Fix the status mismatch
Update the database constraint so `partial` is valid if the UI should support it.

If `partial` is not needed, remove it from:
- `CreatePaymentDialog`
- `EditPaymentDialog`
- `useCreatePayment`
- `useUpdatePayment`
- `PaymentsTable`

### 4. Add safer UI fallbacks
In `useAdminPayments.ts`, ensure missing related profile data does not break rendering:
- fallback student name like `Unknown Student`
- fallback email as empty string
- log the real fetch error once in dev so future failures are easier to diagnose

### 5. Verify end to end
After the fix:
- existing payments should load again in Pending, Upcoming, and All Payments
- newly created payments should appear immediately after create
- student names should render consistently
- `partial` should either work end-to-end or be fully removed

## Files involved
- `src/hooks/useAdminPayments.ts`
- new migration to remove the extra payments/profiles FK
- new migration to fix `payments_status_check`
- possibly:
  - `src/components/admin/payments/CreatePaymentDialog.tsx`
  - `src/components/admin/payments/EditPaymentDialog.tsx`
  - `src/hooks/useCreatePayment.ts`
  - `src/hooks/useUpdatePayment.ts`
  - `src/components/admin/payments/PaymentsTable.tsx`

## Technical details
- Confirmed: the problem is on the read path, not the insert path.
- Confirmed: `payments` rows exist in the database already.
- Confirmed: this does not currently look like an admin RLS access problem.
- Supabase/PostgREST requires explicit `!foreign_key` syntax when multiple FKs can satisfy a join. If the direct embedded join is kept, it must be explicit; otherwise the two-query merge is the more reliable fix.
