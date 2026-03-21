

# Make Announcements System Fully Functional

## Current Gaps
1. **No `type` column** in the `announcements` table -- all announcements default to `'announcement'` type on the student side. Events and updates are only in demo data.
2. **No type selector** in the admin or instructor announcement creation forms.
3. **No filter tabs** on the student messages page to filter by type.
4. **Admin AnnouncementList** doesn't fetch or display the `type` field.
5. **`announcement_reads` RLS** filters by `user_id = auth.uid()` on the left join, but the query doesn't filter reads by the current user -- so read status may be inaccurate (shows reads from ALL users).
6. **Admin can't delete announcements** -- the `announcements` table has no DELETE RLS policy.

## Plan

### 1. Database Migration
Add a `type` column to the `announcements` table:
```sql
ALTER TABLE public.announcements 
ADD COLUMN type text NOT NULL DEFAULT 'announcement';
```
Also add a DELETE policy for admins:
```sql
CREATE POLICY "Admins can delete announcements" 
ON public.announcements FOR DELETE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2. Admin Announcement Form (`AnnouncementForm.tsx`)
- Add a `type` field (Select dropdown) with options: Event, Announcement, Update
- Default to "announcement"
- Include `type` in the insert mutation

### 3. Instructor Announcement Form (`InstructorAnnouncements.tsx`)
- Add a `type` selector (Event, Announcement, Update) alongside the existing target audience selector
- Include `type` in the insert mutation

### 4. Admin Announcement List & Card
- Fetch and display the `type` field
- Show a colored badge for the type (blue=event, amber=announcement, green=update), matching the student-side card

### 5. Student Messages Page (`StudentMessages.tsx`)
- Add filter tabs: All, Events, Announcements, Updates
- Filter the displayed announcements by selected tab
- Include `type` in the fetch query so real data has proper types
- Fix the read status query to filter `announcement_reads` by the current user (`announcement_reads!left(id, read_at).eq(user_id, userId)` filter)

### 6. Student Announcements Hook (`useAnnouncements.ts`)
- Include `type` in the select query
- Map the DB `type` value to the announcement object

### Technical Details
- The `type` column uses a plain `text` type (not enum) for simplicity, constrained by the UI dropdown options
- All three valid values: `'event'`, `'announcement'`, `'update'`
- Existing rows default to `'announcement'`

