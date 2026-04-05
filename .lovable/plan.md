

# Standardize All Dates to American Format (MM/DD/YYYY)

## Problem
Dates across the app use inconsistent formatting -- some use `toLocaleDateString()` (browser-dependent), some use `format()` with various patterns like `MMM d`, `yyyy-MM-dd`, etc. They all need to display in American style: **MM/DD/YYYY**.

## Approach
Create a single shared `formatDateUS` utility function in `src/lib/utils.ts`, then replace all date display calls across the app with it. Internal/API dates (ISO strings for DB queries) stay unchanged -- only **displayed** dates get reformatted.

## Shared Utility

Add to `src/lib/utils.ts`:
```ts
import { format } from "date-fns";
export const formatDateUS = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
};
```

## Files to Update

| File | What changes |
|------|-------------|
| `src/lib/utils.ts` | Add `formatDateUS` helper |
| `src/hooks/student/dashboard/useAnnouncements.ts` | `.toLocaleDateString()` → `formatDateUS(...)` |
| `src/hooks/student/dashboard/useUpcomingClasses.ts` | `.toLocaleDateString()` → `formatDateUS(...)` |
| `src/components/admin/announcements/AnnouncementCard.tsx` | `.toLocaleDateString()` → `formatDateUS(...)` |
| `src/pages/student/StudentMessages.tsx` | 3x `.toLocaleDateString()` → `formatDateUS(...)`; `format(..., 'MMM d, yyyy')` and `format(..., 'MMM d')` → `formatDateUS(...)` |
| `src/pages/instructor/InstructorAnnouncements.tsx` | `.toLocaleDateString()` → `formatDateUS(...)` |
| `src/pages/instructor/InstructorClasses.tsx` | 2x `.toLocaleDateString()` → `formatDateUS(...)` |
| `src/data/mockInstructorData.ts` | `.toLocaleDateString()` → `formatDateUS(...)` |
| `src/hooks/useAdminPayments.ts` | `format(dueDate, 'yyyy-MM-dd')` → `formatDateUS(dueDate)` |
| `src/components/admin/payments/PaymentsTable.tsx` | Already displays `dueDate` string -- will now show MM/DD/YYYY from hook |
| `src/components/instructor/messages/ConversationThread.tsx` | `format(..., 'MMM d, h:mm a')` → `formatDateUS(...) + time` |
| `src/components/instructor/messages/ConversationList.tsx` | `format(..., 'MMM d')` → `formatDateUS(...)` |
| `src/components/student/messages/StudentConversationThread.tsx` | `format(..., 'MMM d, h:mm a')` → `formatDateUS(...) + time` |
| `src/components/student/messages/MessageCard.tsx` | `format(..., 'MMM d, yyyy h:mm a')` → `formatDateUS(...) + time` |

**Not changed** (internal/API use only, not displayed):
- `AdminInstructorPayments.tsx` date range queries (`yyyy-MM-dd` for DB)
- `StudentClasses.tsx` attendance calendar keys (`yyyy-MM-dd` for map lookups)
- `AdminAttendance.tsx` (already uses `MM/dd/yyyy`)

For message timestamps that show both date and time, the format will be `MM/DD/YYYY h:mm a`.

