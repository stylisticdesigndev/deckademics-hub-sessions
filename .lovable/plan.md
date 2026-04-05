

# Streamlined Date Range Picker for Generate Pay Period

## Problem
The current implementation uses two separate `Popover` + `Calendar` combos for start and end dates. This causes:
- Calendar positioning issues (flipping above/below unpredictably) due to Popover auto-placement
- Navigation arrows disappearing at certain months
- Too many clicks: open popover → pick start → close → open another popover → pick end → close

## Solution
Replace the two separate date pickers with a single inline date range calendar, similar to airline booking sites. The user clicks the start date, then clicks the end date, and sees the range highlighted -- all in one view, no popovers.

### How it works
- Use `react-day-picker`'s built-in `mode="range"` which supports selecting a date range with visual highlighting of all days between start and end
- Render the calendar **inline** inside the dialog (not in a popover), eliminating all positioning/arrow bugs
- Show two months side-by-side so the user can see more context
- Display the selected range as text labels above the calendar

### Implementation

**File: `src/pages/admin/AdminInstructorPayments.tsx`**

Replace lines 749-777 (the two Popover/Calendar blocks) with:
- A single `<Calendar mode="range" numberOfMonths={2} />` rendered inline
- State change: replace `generateStartDate` and `generateEndDate` with a single `dateRange: DateRange | undefined` state (`{ from: Date, to: Date }`)
- Show selected dates as formatted text above the calendar
- Update `handleGeneratePreview` to read from `dateRange.from` and `dateRange.to`
- Widen the dialog to `sm:max-w-[650px]` to fit two months side-by-side

**File: `src/components/ui/calendar.tsx`**
- No changes needed -- `DayPicker` already supports `mode="range"` since react-day-picker v8

### User experience
1. Admin clicks "Generate Pay Period"
2. Dialog opens with an inline two-month calendar
3. Admin clicks a start date → it highlights
4. Admin clicks an end date → the full range highlights in between
5. Click "Preview Payments" to proceed

One view, two clicks, no popovers, no positioning bugs.

