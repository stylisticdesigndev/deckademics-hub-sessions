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

export const mockPersonalNotes = [
  {
    id: 'mock-personal-1',
    student_id: 'mock-student',
    title: 'Scratching practice routine',
    content: 'Work on baby scratch → tear scratch → chirp scratch progression. 15 min each technique, then freestyle for 10 min. Record and compare weekly.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-personal-2',
    student_id: 'mock-student',
    title: 'From DJ Master K — Mar 25',
    content: 'Great job on the beat matching exercise today. Your timing is getting much more consistent. Next session we\'ll work on harmonic mixing.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'mock-personal-3',
    student_id: 'mock-student',
    title: 'Set list ideas for showcase',
    content: '1. Intro — ambient pad into deep house\n2. Build energy with progressive house\n3. Peak — tech house banger\n4. Cool down with melodic techno\n5. Closer — classic house anthem',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export const mockStudentConversations = [
  {
    instructorId: 'mock-instructor-1',
    instructorName: 'DJ Master K',
    initials: 'MK',
    avatarUrl: null,
    lastMessage: 'Great work today! Don\'t forget to practice those transitions before next class.',
    lastMessageAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    unreadCount: 1,
  },
  {
    instructorId: 'mock-instructor-2',
    instructorName: 'DJ Sarah B',
    initials: 'SB',
    avatarUrl: null,
    lastMessage: 'Your mix submission has been reviewed — check your notes for feedback.',
    lastMessageAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    unreadCount: 0,
  },
];

export const mockStudentMessages = {
  'mock-instructor-1': [
    {
      id: 'mock-msg-1',
      sender_id: 'mock-instructor-1',
      receiver_id: 'mock-student',
      subject: null,
      content: 'Hey! How\'s the practice going for the 16-bar blend technique?',
      sent_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      read_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      image_url: null,
    },
    {
      id: 'mock-msg-2',
      sender_id: 'mock-student',
      receiver_id: 'mock-instructor-1',
      subject: null,
      content: 'It\'s going well! I recorded a 20-minute mix using the technique. Want me to send it over?',
      sent_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      read_at: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      image_url: null,
    },
    {
      id: 'mock-msg-3',
      sender_id: 'mock-instructor-1',
      receiver_id: 'mock-student',
      subject: null,
      content: 'Great work today! Don\'t forget to practice those transitions before next class.',
      sent_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      read_at: null,
      image_url: null,
    },
  ],
  'mock-instructor-2': [
    {
      id: 'mock-msg-4',
      sender_id: 'mock-instructor-2',
      receiver_id: 'mock-student',
      subject: null,
      content: 'I listened to your mix submission. The EQ work is solid but let\'s work on your transitions in the buildup section.',
      sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      read_at: new Date(Date.now() - 2.5 * 86400000).toISOString(),
      image_url: null,
    },
    {
      id: 'mock-msg-5',
      sender_id: 'mock-student',
      receiver_id: 'mock-instructor-2',
      subject: null,
      content: 'Thanks for the feedback! I\'ll focus on that section.',
      sent_at: new Date(Date.now() - 2.5 * 86400000).toISOString(),
      read_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      image_url: null,
    },
    {
      id: 'mock-msg-6',
      sender_id: 'mock-instructor-2',
      receiver_id: 'mock-student',
      subject: null,
      content: 'Your mix submission has been reviewed — check your notes for feedback.',
      sent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      read_at: new Date(Date.now() - 1.5 * 86400000).toISOString(),
      image_url: null,
    },
  ],
};

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
