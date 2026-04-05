

# Remove Add Instructor Button from Instructor Management

## What changes

Remove both the **"Add Instructor"** button and the **"Convert User to Instructor"** button from the header. Instructors self-register at `/auth/instructor` and admins approve them -- same pattern as students.

## Cleanup

### `src/pages/admin/AdminInstructors.tsx`
- Remove the "Add Instructor" dialog (lines 493-579) and all related state: `addInstructorOpen`, `newInstructor`, `handleAddInstructor`
- Remove the "Convert User to Instructor" dialog (lines 432-491) and related state: `showCreateInstructorDialog`, `selectedUserId`, `handleCreateInstructor`, `eligibleUsers` query
- Remove unused imports: `UserPlus`, `UserRound`, `Label`, `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue`
- The header becomes just the title and description (no buttons)

### `src/hooks/useAdminInstructors.ts`
- Remove `addNewInstructor` mutation and `createInstructor` mutation (dead code)
- Remove `allUsers` query (only used by "Convert User" dialog)
- Remove their exports

### `supabase/functions/create-instructor/index.ts`
- Can remain (no harm), but is now dead code

## Files to edit

| File | Change |
|------|--------|
| `src/pages/admin/AdminInstructors.tsx` | Remove both buttons, dialogs, related state/handlers, and unused imports |
| `src/hooks/useAdminInstructors.ts` | Remove `addNewInstructor`, `createInstructor`, `allUsers` and their exports |

