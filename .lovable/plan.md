

# Add Profile Picture Upload (Required)

## Current State
- "Upload Photo" buttons exist on all profile setup pages (Student, Instructor, Admin) but are **non-functional** — no click handler, no upload logic
- The `profiles` table already has an `avatar_url` column
- `DashboardLayout` already renders `AvatarImage` from `avatar_url`
- No storage bucket exists for avatars

## Plan

### 1. Database Migration — Create avatars storage bucket
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update/delete their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public read access
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### 2. Create shared `AvatarUpload` component
**New file: `src/components/profile/AvatarUpload.tsx`**
- Accepts `currentUrl`, `onUpload(url)`, `required`, `initials` props
- Renders Avatar with AvatarImage (if URL exists) or AvatarFallback
- Hidden file input triggered by "Upload Photo" / "Change Photo" button
- On file select: uploads to `avatars/{userId}/{timestamp}.{ext}` via Supabase Storage
- Shows loading state during upload
- If `required` and no photo, shows a red validation message

### 3. Wire up profile setup pages (make photo required)
**Files: `StudentProfileSetup.tsx`, `InstructorProfileSetup.tsx`, `AdminProfileSetup.tsx`**
- Replace static Avatar + non-functional button with `<AvatarUpload>`
- Store `avatarUrl` in form state
- On upload success, set `avatarUrl` state
- On submit, include `avatar_url` in the `updateProfile()` call
- Block form submission if no avatar uploaded (required validation)

### 4. Wire up profile edit pages
**Files: `StudentProfile.tsx`, `InstructorProfile.tsx`**
- In edit mode, replace static Avatar with `<AvatarUpload>` (not required here, since they already passed setup)
- Show current `avatar_url` from profile data
- On upload, update `avatar_url` via `updateProfile()`
- In view mode, show `AvatarImage` with the stored URL

### 5. Update AuthProvider `updateProfile`
**File: `src/providers/AuthProvider.tsx`**
- Ensure `avatar_url` is included in the profile update query (it should already work since it accepts `Partial<Profile>`, but verify the Supabase update call passes it through)

### Files Changed
- Migration SQL (new storage bucket + policies)
- `src/components/profile/AvatarUpload.tsx` (new)
- `src/pages/student/StudentProfileSetup.tsx`
- `src/pages/instructor/InstructorProfileSetup.tsx`
- `src/pages/admin/AdminProfileSetup.tsx`
- `src/pages/student/StudentProfile.tsx`
- `src/pages/instructor/InstructorProfile.tsx`
- `src/providers/AuthProvider.tsx` (if needed)

