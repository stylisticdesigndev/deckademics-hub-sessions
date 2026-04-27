---
name: Mock User Management
description: Admin-controlled mock/test user tagging, hiding, and purging via profiles.is_mock and app_settings.hide_mock_users
type: feature
---
- `profiles.is_mock` boolean (default false) flags test/seed accounts.
- `app_settings.hide_mock_users` global toggle filters mocks from admin Students/Instructors lists when on.
- RPC `set_mock_flag(_user_ids uuid[], _is_mock bool)` — admin only, bulk tag/untag.
- RPC `delete_all_mock_users()` — admin only, cascades through students/instructors/messages/notes/attendance/payments/etc, then deletes auth.users rows.
- UI: per-row "Mock" amber badge + per-user toggle in detail Sheet + bulk "Mark as Mock" button + dedicated MockUsersSection on AdminSettings page (hide toggle, list, unmark, permanent delete with confirm).
- `get_instructors_with_profiles` RPC returns `is_mock` inside the profile JSON.
