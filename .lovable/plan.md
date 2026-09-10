# A separate Payroll app for Nick

Yes — this can live inside the same project but behave like its own standalone desktop app that installs to the dock/taskbar and opens straight on the payment screens.

## What Nick gets

- A dedicated web address: `/payroll`
- Its own sign-in page at that address. Signing in with his existing credentials goes directly to payroll — no dashboards, no sidebar full of school menus.
- Installable as its own desktop app with its own name ("Deckademics Payroll") and icon, separate from the main Deckademics app already installed.
- Owner-only: anyone else who reaches the address sees a short "not authorized" message.
- The same payment screens stay available inside the main admin app, exactly as they are now. Nothing is removed.

## Screens inside the payroll app

A slim top bar with three tabs and a sign-out button:

1. Instructor Payments (cut checks, pay periods, payroll history)
2. Student Payments (pending, upcoming, all payments)
3. Payments overview (the current ledger screen)

Desktop-first layout, but it still works on a phone.

## Technical notes

- New route group `/payroll` in `src/App.tsx` with its own layout component (`PayrollLayoutRoute`), not `DashboardLayout`.
- `/payroll/login` renders the existing auth form; on success it redirects to `/payroll/instructors` instead of a role dashboard. Already-signed-in owners skip it.
- Access gate reuses `canAccessPayroll` from `src/constants/adminPermissions.ts`; a `PayrollProtectedRoute` wraps the group (auth + owner email).
- Pages are reused as-is — `AdminInstructorPayments`, `AdminPayments`, `AdminLedgerPreview` are rendered inside the payroll layout. No duplication of payroll logic or hooks.
- Second manifest `public/payroll.webmanifest` with `name: "Deckademics Payroll"`, `id: "/payroll"`, `start_url: "/payroll"`, `scope: "/payroll"`, `display: "standalone"`, plus a distinct icon. A small component swaps the `<link rel="manifest">` to this file while on `/payroll` routes so the browser offers the payroll app for install rather than the main one.
- Payroll icon generated as a new asset in `public/`.
- No database or payment-logic changes.

## Caveats

- Two installed apps on the same device share one browser session, so signing out of one signs out of the other.
- Desktop Chrome/Edge give a clean install button. Safari on macOS supports "Add to Dock"; iOS installs via Share > Add to Home Screen.
