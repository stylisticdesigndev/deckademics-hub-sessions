

# Unified Notification Dropdown for Students and Instructors

## What changes

Replace the simple bell button (that navigates to messages) on student/instructor headers with a popover dropdown matching the admin's `NotificationDropdown` architecture. The dropdown will show both **unread messages** and **unread announcements** as individual notification items, sorted by time.

## 1. Create `src/hooks/useUserNotifications.ts`

A new hook that combines two data sources into a unified notification list:

- **Unread messages**: Query `messages` where `receiver_id = userId` and `read_at IS NULL`. Each becomes a notification item with type `message`, title from sender name, message from content preview.
- **Unread announcements**: Query `announcements` targeted at the user's role, left-joining `announcement_reads` to find ones the user hasn't read. Each becomes a notification item with type `announcement`.

Returns: `{ notifications, unreadCount, markAsRead, markAllAsRead }`

- `markAsRead` for messages: updates `read_at` on the message row
- `markAsRead` for announcements: inserts into `announcement_reads`
- `markAllAsRead`: does both in parallel
- Uses `useQuery` with 30s polling (matching admin pattern)
- Needs sender profile names, so join `profiles` on `sender_id` for messages

## 2. Create `src/components/notifications/UserNotificationDropdown.tsx`

A near-copy of `NotificationDropdown.tsx` but using `useUserNotifications` instead of `useAdminNotifications`. Key differences:

- Icon map: `message` type gets `MessageSquare` icon, `announcement` type gets `Bell` icon
- Clicking a message notification navigates to the messages page
- Clicking an announcement notification navigates to the announcements page
- Same optimistic unread count pattern
- Accepts `userType` prop (`'student' | 'instructor'`) for routing and role filtering

## 3. Update `src/components/layout/DashboardLayout.tsx`

- Replace the `{userType !== 'admin' && ...}` bell button block with `<UserNotificationDropdown userType={userType} />`
- Remove the `unreadNotifications` state, the `useEffect` that fetches announcement counts, and `handleNotificationClick` — all replaced by the dropdown component
- Keep the admin `NotificationDropdown` as-is

## Files to create/edit

| File | Change |
|------|--------|
| `src/hooks/useUserNotifications.ts` | New hook combining messages + announcements |
| `src/components/notifications/UserNotificationDropdown.tsx` | New dropdown component |
| `src/components/layout/DashboardLayout.tsx` | Swap bell button for new dropdown, remove old notification logic |

