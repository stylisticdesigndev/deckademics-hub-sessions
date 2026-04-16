## Bug Reports: Active / Archived Tabs

### Approach

Use a two-tab layout (Active / Archived) instead of the current flat list with a status filter dropdown.  
  
Also add a timestamp to the resolved and closed to know then it was

**Archive logic — no database changes needed:**

- **Active tab** shows: `open` and `in_progress` reports
- **Archived tab** shows: `resolved` and `closed` reports — no time delay needed

**Why auto-archive resolved immediately:**
Resolved means the fix is confirmed. There's no actionable reason to keep it in the active view. If it regresses, the user submits a new report. A time-based delay adds complexity without real benefit — the admin already made a deliberate decision by marking it resolved.

The status filter dropdown moves inside each tab so you can still filter within archived (e.g. show only "resolved" or only "closed").

### Changes

**File: `src/pages/admin/AdminBugReports.tsx**`

- Add `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from existing UI components
- Default tab: "Active" (open + in_progress)
- Second tab: "Archived" (resolved + closed) with a count badge
- Move the existing status filter dropdown inside each tab — Active tab filters between All/Open/In Progress; Archived tab filters between All/Resolved/Closed
- Keep all existing card rendering, status change, notes, copy, screenshot functionality unchanged
- When an admin changes status from open → resolved via the dropdown, it automatically moves to the Archived tab on next render

### Layout

```text
┌─────────────────────────────────────┐
│ 🐛 Bug Reports                     │
│ Review and manage bug reports...    │
├──────────────┬──────────────────────┤
│ Active (3)   │ Archived (12)        │  ← tabs
├──────────────┴──────────────────────┤
│ Filter: [All ▾]                     │
│                                     │
│ ┌─ Bug Card ──────────────────────┐ │
│ │ Title / metadata / status       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

No database migration required — purely a UI reorganization using existing status values.