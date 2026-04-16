## Bug Report Enhancement: Device Type, Screenshot Upload, and Copy Update

### What's already done

- Database columns `device_type` and `screenshot_url` added to `bug_reports` table

### What still needs to be done

**1. Create `bug-screenshots` storage bucket (database migration)**

- Create the bucket with public access
- Add RLS policies: authenticated users can upload, anyone authenticated can view

**2. Update `BugReportDialog.tsx` — add device type selector and screenshot upload**

- Add a device type dropdown with options: iPhone, Android Phone, iPad/Tablet, Desktop (Mac), Desktop (Windows), Other
- Add a file input for screenshot upload (accepts image types, max ~5MB)
- On submit: upload image to `bug-screenshots` bucket, get public URL, then insert the bug report with `device_type` and `screenshot_url`
- Reset new fields on close

**3. Update `AdminBugReports.tsx` — display device type and screenshot, update copy**

- Add `device_type` and `screenshot_url` to the `BugReport` interface
- Show device type in the report metadata line (next to role and date)
- Display screenshot as a clickable thumbnail that opens in a new tab
- Update the copy button to include device type: `Title\n\nDescription\n\nDevice: iPhone` 
- If you can copy the uploaded screenshot to the copy button add that as well if you can

### Technical details

- Storage bucket: `bug-screenshots`, public, with authenticated upload/view policies
- File path pattern: `{user_id}/{timestamp}_{filename}` to avoid collisions
- Image upload uses the same Supabase storage pattern as existing avatar uploads
- Screenshot field is optional — users can submit without one