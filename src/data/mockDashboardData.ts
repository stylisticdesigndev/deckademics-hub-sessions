// Mock data for demo mode - remove this file when no longer needed

export const mockStudentData = {
  level: 'Intermediate',
  totalProgress: 67,
  currentModule: 'Advanced Mixing',
  moduleProgress: 45,
  hoursCompleted: 24,
  instructor: 'DJ Master K',
  nextClass: 'Tomorrow at 3:00 PM',
};

export const mockSkills = [
  { skill_name: 'Beat Matching', proficiency: 82 },
  { skill_name: 'EQ Control', proficiency: 71 },
  { skill_name: 'Scratching', proficiency: 55 },
  { skill_name: 'Track Selection', proficiency: 90 },
  { skill_name: 'Transitions', proficiency: 63 },
  { skill_name: 'Performance', proficiency: 48 },
];

export const mockAttendance = {
  present: 9,
  absent: 1,
  late: 0,
  total: 10,
};

export const mockUpcomingClasses = [
  {
    id: 'mock-1',
    title: 'Intermediate Class',
    date: 'Tomorrow',
    time: '3:00 PM',
    instructor: 'DJ Master K',
    location: 'Classroom 1',
    duration: '1h 30m',
    attendees: 0,
    isUpcoming: true,
  },
  {
    id: 'mock-2',
    title: 'Intermediate Class',
    date: 'Next Wednesday',
    time: '5:00 PM',
    instructor: 'DJ Master K',
    location: 'Classroom 2',
    duration: '1h 30m',
    attendees: 0,
    isUpcoming: true,
  },
];

export const mockNotes = [
  {
    id: 'mock-note-1',
    title: 'Great progress on transitions',
    content: 'Your transitions between tracks are getting much smoother. Keep practicing the 16-bar blend technique we covered last session.',
    is_read: false,
    created_at: '2026-03-20T14:00:00Z',
    instructor: { first_name: 'DJ Master', last_name: 'K' },
  },
  {
    id: 'mock-note-2',
    title: 'Practice EQ sweeps',
    content: 'Focus on using the low-pass filter during buildups. Try the exercise where you sweep from 0 to full over 8 bars.',
    is_read: true,
    created_at: '2026-03-15T10:30:00Z',
    instructor: { first_name: 'DJ Master', last_name: 'K' },
  },
  {
    id: 'mock-note-3',
    title: 'Homework: Mix 3 tracks',
    content: 'Record a 15-minute mix blending at least 3 tracks. Focus on key matching and energy flow between songs.',
    is_read: true,
    created_at: '2026-03-10T09:00:00Z',
    instructor: { first_name: 'DJ Master', last_name: 'K' },
  },
];

export const mockAnnouncements = [
  {
    id: 'mock-ann-1',
    title: 'End of Semester Showcase',
    content: 'Get ready for the end of semester showcase! All students will perform a 10-minute set. Start preparing your tracklist now.',
    date: '2026-03-20',
    instructor: { name: 'DJ Master K', initials: 'MK' },
    isNew: true,
    type: 'event' as const,
  },
  {
    id: 'mock-ann-2',
    title: 'New Equipment Arrived',
    content: 'We just received the new Pioneer DDJ-REV7 controllers. They will be available in Classroom 1 starting next week.',
    date: '2026-03-18',
    instructor: { name: 'Admin', initials: 'AD' },
    isNew: false,
    type: 'announcement' as const,
  },
];

export const mockProfileData = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '(555) 123-4567',
  bio: 'Aspiring DJ with a passion for house and techno. Currently learning advanced mixing techniques and building my first live set.',
  course: {
    title: 'DJ Production & Performance',
    level: 'Intermediate',
    duration_weeks: 12,
  },
  instructor: {
    first_name: 'DJ Master',
    last_name: 'K',
  },
};
