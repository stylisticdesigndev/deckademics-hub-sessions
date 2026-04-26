## Add Pay Ledger to Instructor Navigation

The `InstructorLedger` page already exists at `/instructor/ledger` but is not linked in the sidebar — Nick can only reach it by typing the URL.

### Change

**File:** `src/components/navigation/InstructorNavigation.tsx`

Add a new nav item using the already-imported `Wallet` icon, placed between **Curriculum** and **Messages** (logical grouping with other ongoing-work items):

```tsx
{ title: "Pay Ledger", icon: Wallet, href: "/instructor/ledger" },
```

### Result

Nick will see a **Pay Ledger** entry in his sidebar that opens the existing payment history page showing:
- Unpaid balance & sessions
- Lifetime paid total
- Extra Pay table (entries you add from the admin side)
- Itemized session list (Paid/Unpaid)

No other files need changes — the route, page, and data hooks are all already in place.
