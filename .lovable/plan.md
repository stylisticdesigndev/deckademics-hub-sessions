

# Remove Add Student Button + Clean Up Demo Students

## What changes

### 1. Remove "Add Student" and "Create Demo Student" buttons from `AdminStudents.tsx`
Both buttons are unnecessary:
- Students self-register and admins approve/decline them
- Demo students were for testing and are no longer needed

Remove the buttons, the `handleCreateDemoStudent` function, and the `isCreatingDemo` state. Also remove the `createDemoStudent` import from `useAdminStudents` if no longer used.

### 2. Delete the 6 demo student records from the database
All are inactive with emails like `demo*.example.com`:
- `dfa19042-be3d-4a7d-87d7-3a91e78df810`
- `0ace5fe2-be64-42f8-bd89-3f37c92c668b`
- `e513c88f-0e1f-4762-935b-2b62adad3cbf`
- `07c3b0c1-d681-443a-b865-29ce6637168d`
- `a24182e3-dd34-4d49-a661-d1743edf5ce2`
- `803d4086-13bc-4ea9-9b69-8600f5671eb3`

Delete from `students`, `profiles`, and `user_roles` tables for these IDs.

### 3. Clean up unused demo student code
- Remove `createDemoStudent` and `debugFetchStudents` from `useAdminStudents.ts` (dead code)
- The `create-demo-student` edge function can remain (no harm) or be deleted

## Files to edit

| File | Change |
|------|--------|
| `src/pages/admin/AdminStudents.tsx` | Remove Add Student button, Create Demo Student button, and related state/handlers |
| `src/hooks/useAdminStudents.ts` | Remove `createDemoStudent` and `debugFetchStudents` functions and their exports |
| Database | Delete 6 demo student records from `students`, `profiles`, `user_roles` |

