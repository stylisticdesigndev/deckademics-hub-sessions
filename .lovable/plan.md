

# Truncated "All" Tab with "View All" Links

## Summary
Limit the "All" tab to show only the 5 most recent items (messages + announcements combined by date), with "View all messages →" and "View all announcements →" links that switch to the respective tabs.

## Changes

### `src/pages/student/StudentMessages.tsx`

1. In the "All" `TabsContent`, limit displayed items to the 5 most recent by merging conversations and announcements into a single sorted-by-date list, then slicing to 5.

2. Add "View all messages →" and "View all announcements →" links at the bottom that programmatically switch the active tab. This requires converting from `defaultValue` to controlled `Tabs` with a `value` state.

3. Messages and Announcements tabs remain unchanged — they show the full untruncated lists.

### Technical Details
- Add `const [activeTab, setActiveTab] = useState("all")` and use controlled `<Tabs value={activeTab} onValueChange={setActiveTab}>`
- In the "All" tab, create a combined array of conversations (using `lastMessageAt`) and announcements (using `date`), sort by recency, take first 5
- Render each item using existing `ConversationItem` or `AnnouncementCard` based on type
- Add clickable "View all →" links that call `setActiveTab("messages")` / `setActiveTab("announcements")`

