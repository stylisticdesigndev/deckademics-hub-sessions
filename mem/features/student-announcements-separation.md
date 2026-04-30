---
name: Student Announcements Separation
description: Student announcements live on a dedicated /student/announcements route with its own sidebar item and unread badge — never bundled into Messages
type: feature
---
For students, Messages and Announcements are separate sections:
- `/student/messages` — only 1:1 instructor conversations.
- `/student/announcements` — read/dismiss/category-filter view (event/announcement/update) for school-wide broadcasts via the announcements + announcement_reads tables.
- Sidebar shows both as separate items with independent unread badges (`useUnreadMessagesCount`, `useUnreadAnnouncementsCount`).
- Instructors/admins keep their existing combined or admin-managed announcement flows — this split is student-only.
