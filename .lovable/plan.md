

# Add Notification Preferences to Student Profile

## Overview
Add a "Notification Preferences" card to the student profile page with toggles for email and SMS alerts on announcements. Store preferences in a new `notification_preferences` table.

## Database Changes

**New table: `notification_preferences`**
```sql
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT false,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own preferences
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all preferences" ON public.notification_preferences
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
```

Defaults: email ON, SMS OFF (SMS requires a phone number).

## Frontend Changes

### 1. Create `useNotificationPreferences` hook
- Fetches/upserts the user's notification preferences from `notification_preferences`
- Provides `preferences` state and `updatePreferences` mutation

### 2. Add "Notification Preferences" card to `StudentProfile.tsx`
- New card in the right sidebar (below Instructor card)
- Toggle for "Email Notifications" with description: "Receive announcements and updates via email"
- Toggle for "SMS Notifications" with description: "Receive important alerts via text message"
- Phone number input field (shown when SMS is enabled)
- Auto-saves on toggle change (no save button needed)
- Uses the `Switch` component already in the project

## Notes
- This creates the preference storage and UI only. Actual email/SMS sending would be a separate implementation step using an edge function + Twilio (for SMS) or email infrastructure.
- The toggles will be functional for saving preferences immediately, ready for when the notification sending backend is wired up.

