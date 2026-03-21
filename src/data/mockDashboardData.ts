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
  present: 18,
  absent: 2,
  late: 3,
  total: 23,
};

export const mockUpcomingClasses = [
  {
    id: 'mock-1',
    title: 'Advanced Beat Matching',
    date: 'Tomorrow',
    time: '3:00 PM',
    instructor: 'DJ Master K',
    location: 'Studio A',
    duration: '1 hour',
    attendees: 6,
    isUpcoming: true,
  },
  {
    id: 'mock-2',
    title: 'Scratch Techniques 201',
    date: 'Wednesday',
    time: '5:00 PM',
    instructor: 'DJ Master K',
    location: 'Studio B',
    duration: '1.5 hours',
    attendees: 4,
    isUpcoming: true,
  },
  {
    id: 'mock-3',
    title: 'Live Performance Prep',
    date: 'Friday',
    time: '2:00 PM',
    instructor: 'DJ Master K',
    location: 'Main Stage',
    duration: '2 hours',
    attendees: 8,
    isUpcoming: true,
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
    content: 'We just received the new Pioneer DDJ-REV7 controllers. They will be available in Studio A starting next week.',
    date: '2026-03-18',
    instructor: { name: 'Admin', initials: 'AD' },
    isNew: false,
    type: 'announcement' as const,
  },
];
