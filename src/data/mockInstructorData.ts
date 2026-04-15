/**
 * DEMO DATA — Remove this entire file when demo mode is no longer needed.
 *
 * Provides static mock data for the Instructor Dashboard, Classes, Students,
 * Messages, and Profile pages when "Demo Mode" is toggled on.
 *
 * Search for "===== DEMO MODE" across the codebase to find all usage sites.
 */
// Mock data for instructor demo mode
import { formatDateUS } from '@/lib/utils';

export const mockInstructorDashboard = {
  students: [
    { id: 'demo-s2', name: 'Sarah Williams', progress: 45, level: 'Beginner', hasNotes: false, initials: 'SW', classTime: '3:30 PM - 5:00 PM' },
    { id: 'demo-s1', name: 'Marcus Chen', progress: 78, level: 'Intermediate', hasNotes: true, initials: 'MC', classTime: '5:30 PM - 7:00 PM' },
    { id: 'demo-s4', name: 'Emily Rodriguez', progress: 60, level: 'Intermediate', hasNotes: true, initials: 'ER', classTime: '5:30 PM - 7:00 PM' },
    { id: 'demo-s3', name: 'Jordan Davis', progress: 92, level: 'Advanced', hasNotes: true, initials: 'JD', classTime: '7:30 PM - 9:00 PM' },
  ],
  todayClasses: 3,
  averageProgress: 69,
  totalStudents: 4,
};

const today = new Date();
const formatMockDate = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return formatDateUS(d);
};

export const mockInstructorClasses = [
  {
    id: 'demo-c1',
    week: 'Week 4',
    title: 'Beginner Class',
    date: formatMockDate(0),
    time: '2:00 PM',
    duration: '90 min',
    room: 'Classroom 1',
    student: { id: 'demo-s2', name: 'Sarah Williams', initials: 'SW' },
  },
  {
    id: 'demo-c2',
    week: 'Week 7',
    title: 'Intermediate Class',
    date: formatMockDate(0),
    time: '4:00 PM',
    duration: '90 min',
    room: 'Classroom 2',
    student: { id: 'demo-s1', name: 'Marcus Chen', initials: 'MC' },
  },
  {
    id: 'demo-c3',
    week: 'Week 7',
    title: 'Intermediate Class',
    date: formatMockDate(0),
    time: '4:00 PM',
    duration: '90 min',
    room: 'Classroom 2',
    student: { id: 'demo-s4', name: 'Emily Rodriguez', initials: 'ER' },
  },
  {
    id: 'demo-c4',
    week: 'Week 10',
    title: 'Advanced Class',
    date: formatMockDate(1),
    time: '6:00 PM',
    duration: '120 min',
    room: 'Classroom 3',
    student: { id: 'demo-s3', name: 'Jordan Davis', initials: 'JD' },
  },
  {
    id: 'demo-c5',
    week: 'Week 4',
    title: 'Beginner Class',
    date: formatMockDate(5),
    time: '2:00 PM',
    duration: '90 min',
    room: 'Classroom 1',
    student: { id: 'demo-s2', name: 'Sarah Williams', initials: 'SW' },
  },
  {
    id: 'demo-c6',
    week: 'Week 8',
    title: 'Intermediate Class',
    date: formatMockDate(7),
    time: '4:00 PM',
    duration: '90 min',
    room: 'Classroom 2',
    student: { id: 'demo-s1', name: 'Marcus Chen', initials: 'MC' },
  },
  {
    id: 'demo-c7',
    week: 'Week 5',
    title: 'Beginner Class',
    date: formatMockDate(-2),
    time: '10:00 AM',
    duration: '90 min',
    room: 'Classroom 1',
    student: { id: 'demo-s2', name: 'Sarah Williams', initials: 'SW' },
  },
  {
    id: 'demo-c8',
    week: 'Week 11',
    title: 'Advanced Class',
    date: formatMockDate(20),
    time: '6:00 PM',
    duration: '120 min',
    room: 'Classroom 3',
    student: { id: 'demo-s3', name: 'Jordan Davis', initials: 'JD' },
  },
];

export const mockInstructorStudents = [
  {
    id: 'demo-s1',
    name: 'Marcus Chen',
    level: 'intermediate',
    progress: 78,
    lastActive: '2 hours ago',
    initials: 'MC',
    nextClass: 'Today at 4:00 PM',
    email: 'marcus.chen@example.com',
    enrollmentDate: '2026-01-15',
    notes: ['Mar 25: Great improvement on beat matching this week', 'Mar 18: Needs to practice EQ transitions'],
    moduleProgress: [
      { moduleId: '1', moduleName: 'Introduction to DJ Equipment', progress: 100, lessons: [
        { id: '1-1', title: 'Turntables & CDJs', completed: true },
        { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
        { id: '1-3', title: 'Headphones & Monitors', completed: true },
        { id: '1-4', title: 'Software Overview', completed: true },
      ]},
      { moduleId: '2', moduleName: 'Beat Matching Fundamentals', progress: 75, lessons: [
        { id: '2-1', title: 'Understanding BPM', completed: true },
        { id: '2-2', title: 'Manual Beat Matching', completed: true },
        { id: '2-3', title: 'Beat Matching with Software', completed: true },
        { id: '2-4', title: 'Troubleshooting Common Issues', completed: false },
      ]},
      { moduleId: '3', moduleName: 'Basic Mixing Techniques', progress: 50, lessons: [
        { id: '3-1', title: 'EQ Mixing', completed: true },
        { id: '3-2', title: 'Volume Fading', completed: true },
        { id: '3-3', title: 'Filter Effects', completed: false },
        { id: '3-4', title: 'Intro to Phrase Mixing', completed: false },
      ]},
    ],
  },
  {
    id: 'demo-s2',
    name: 'Sarah Williams',
    level: 'beginner',
    progress: 45,
    lastActive: '1 day ago',
    initials: 'SW',
    nextClass: 'Today at 2:00 PM',
    email: 'sarah.williams@example.com',
    enrollmentDate: '2026-02-01',
    notes: ['Mar 22: Starting to understand basic mixing concepts'],
    moduleProgress: [
      { moduleId: '1', moduleName: 'Introduction to DJ Equipment', progress: 75, lessons: [
        { id: '1-1', title: 'Turntables & CDJs', completed: true },
        { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
        { id: '1-3', title: 'Headphones & Monitors', completed: true },
        { id: '1-4', title: 'Software Overview', completed: false },
      ]},
      { moduleId: '2', moduleName: 'Beat Matching Fundamentals', progress: 25, lessons: [
        { id: '2-1', title: 'Understanding BPM', completed: true },
        { id: '2-2', title: 'Manual Beat Matching', completed: false },
        { id: '2-3', title: 'Beat Matching with Software', completed: false },
        { id: '2-4', title: 'Troubleshooting Common Issues', completed: false },
      ]},
    ],
  },
  {
    id: 'demo-s3',
    name: 'Jordan Davis',
    level: 'advanced',
    progress: 92,
    lastActive: '3 hours ago',
    initials: 'JD',
    nextClass: 'Tomorrow at 6:00 PM',
    email: 'jordan.davis@example.com',
    enrollmentDate: '2025-09-10',
    notes: ['Mar 26: Ready for the showcase performance', 'Mar 20: Excellent scratching technique'],
    moduleProgress: [
      { moduleId: '1', moduleName: 'Introduction to DJ Equipment', progress: 100, lessons: [
        { id: '1-1', title: 'Turntables & CDJs', completed: true },
        { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
        { id: '1-3', title: 'Headphones & Monitors', completed: true },
        { id: '1-4', title: 'Software Overview', completed: true },
      ]},
      { moduleId: '2', moduleName: 'Beat Matching Fundamentals', progress: 100, lessons: [
        { id: '2-1', title: 'Understanding BPM', completed: true },
        { id: '2-2', title: 'Manual Beat Matching', completed: true },
        { id: '2-3', title: 'Beat Matching with Software', completed: true },
        { id: '2-4', title: 'Troubleshooting Common Issues', completed: true },
      ]},
      { moduleId: '3', moduleName: 'Basic Mixing Techniques', progress: 100, lessons: [
        { id: '3-1', title: 'EQ Mixing', completed: true },
        { id: '3-2', title: 'Volume Fading', completed: true },
        { id: '3-3', title: 'Filter Effects', completed: true },
        { id: '3-4', title: 'Intro to Phrase Mixing', completed: true },
      ]},
      { moduleId: '4', moduleName: 'Scratching Basics', progress: 75, lessons: [
        { id: '4-1', title: 'Proper Handling of Vinyl', completed: true },
        { id: '4-2', title: 'Baby Scratch', completed: true },
        { id: '4-3', title: 'Forward & Back Scratch', completed: true },
        { id: '4-4', title: 'Scribble Scratch', completed: false },
      ]},
      { moduleId: '5', moduleName: 'Music Theory for DJs', progress: 75, lessons: [
        { id: '5-1', title: 'Key Matching', completed: true },
        { id: '5-2', title: 'Musical Phrasing', completed: true },
        { id: '5-3', title: 'Song Structure', completed: true },
        { id: '5-4', title: 'Harmonic Mixing', completed: false },
      ]},
    ],
  },
  {
    id: 'demo-s4',
    name: 'Emily Rodriguez',
    level: 'intermediate',
    progress: 60,
    lastActive: '5 hours ago',
    initials: 'ER',
    nextClass: 'Today at 4:00 PM',
    email: 'emily.rodriguez@example.com',
    enrollmentDate: '2026-01-20',
    notes: ['Mar 24: Good energy in class today, keep it up!'],
    moduleProgress: [
      { moduleId: '1', moduleName: 'Introduction to DJ Equipment', progress: 100, lessons: [
        { id: '1-1', title: 'Turntables & CDJs', completed: true },
        { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
        { id: '1-3', title: 'Headphones & Monitors', completed: true },
        { id: '1-4', title: 'Software Overview', completed: true },
      ]},
      { moduleId: '2', moduleName: 'Beat Matching Fundamentals', progress: 50, lessons: [
        { id: '2-1', title: 'Understanding BPM', completed: true },
        { id: '2-2', title: 'Manual Beat Matching', completed: true },
        { id: '2-3', title: 'Beat Matching with Software', completed: false },
        { id: '2-4', title: 'Troubleshooting Common Issues', completed: false },
      ]},
      { moduleId: '3', moduleName: 'Basic Mixing Techniques', progress: 25, lessons: [
        { id: '3-1', title: 'EQ Mixing', completed: true },
        { id: '3-2', title: 'Volume Fading', completed: false },
        { id: '3-3', title: 'Filter Effects', completed: false },
        { id: '3-4', title: 'Intro to Phrase Mixing', completed: false },
      ]},
    ],
  },
];

export const mockInstructorStudentList = [
  { id: 'demo-s1', name: 'Marcus Chen', initials: 'MC' },
  { id: 'demo-s2', name: 'Sarah Williams', initials: 'SW' },
  { id: 'demo-s3', name: 'Jordan Davis', initials: 'JD' },
  { id: 'demo-s4', name: 'Emily Rodriguez', initials: 'ER' },
];

export const mockInstructorDirectMessages = {
  inbox: [
    {
      id: 'demo-dm-in-1',
      sender_id: 'demo-s1',
      receiver_id: 'demo-instructor',
      subject: 'Question about beat matching',
      content: 'Hey, I was practicing the manual beat matching exercise and I keep drifting off tempo after about 30 seconds. Any tips?',
      sent_at: '2026-03-27T14:30:00Z',
      read_at: null,
      sender_name: 'Marcus Chen',
      receiver_name: 'You',
    },
    {
      id: 'demo-dm-in-2',
      sender_id: 'demo-s3',
      receiver_id: 'demo-instructor',
      subject: 'Showcase song selection',
      content: 'I have narrowed my showcase set down to 3 tracks. Can we go over them in our next session?',
      sent_at: '2026-03-26T10:15:00Z',
      read_at: '2026-03-26T11:00:00Z',
      sender_name: 'Jordan Davis',
      receiver_name: 'You',
    },
    {
      id: 'demo-dm-in-3',
      sender_id: 'demo-s2',
      receiver_id: 'demo-instructor',
      subject: 'Will miss next class',
      content: 'I have a doctor\'s appointment next Tuesday and won\'t be able to make it to class. Can I make it up on Thursday?',
      sent_at: '2026-03-25T09:00:00Z',
      read_at: '2026-03-25T09:45:00Z',
      sender_name: 'Sarah Williams',
      receiver_name: 'You',
    },
  ],
  sent: [
    {
      id: 'demo-dm-out-1',
      sender_id: 'demo-instructor',
      receiver_id: 'demo-s1',
      subject: 'Practice assignment for this week',
      content: 'Marcus, please focus on keeping your beat match locked for 2 full minutes this week. Start at 120 BPM and work your way up to 128.',
      sent_at: '2026-03-27T08:00:00Z',
      read_at: '2026-03-27T09:30:00Z',
      sender_name: 'You',
      receiver_name: 'Marcus Chen',
    },
    {
      id: 'demo-dm-out-2',
      sender_id: 'demo-instructor',
      receiver_id: 'demo-s4',
      subject: 'Great progress today!',
      content: 'Emily, your EQ transitions are really improving. Keep practicing the high-pass filter sweeps we worked on today.',
      sent_at: '2026-03-26T18:00:00Z',
      read_at: null,
      sender_name: 'You',
      receiver_name: 'Emily Rodriguez',
    },
    {
      id: 'demo-dm-out-3',
      sender_id: 'demo-instructor',
      receiver_id: 'demo-s3',
      subject: 'Re: Showcase song selection',
      content: 'Absolutely! Bring your USB with the tracks and we will go through them together. I think you are ready for a great performance.',
      sent_at: '2026-03-26T11:05:00Z',
      read_at: '2026-03-26T12:00:00Z',
      sender_name: 'You',
      receiver_name: 'Jordan Davis',
    },
  ],
};

export const mockInstructorProfile = {
  name: 'DJ Master K',
  email: 'djmasterk@deckademics.com',
  phone: '(555) 987-6543',
  bio: 'Professional DJ and music producer with over 10 years of experience. Specializing in hip-hop, house, and electronic music. Passionate about teaching the next generation of DJs.',
  expertiseAreas: 'Beat Matching, Scratching, Music Production, Live Performance',
  schedule: [
    { day: 'Monday', hours: '3:30 PM - 5:00 PM, 5:30 PM - 7:00 PM' },
    { day: 'Wednesday', hours: '3:30 PM - 5:00 PM, 7:30 PM - 9:00 PM' },
    { day: 'Friday', hours: '5:30 PM - 7:00 PM, 7:30 PM - 9:00 PM' },
  ],
};

export const mockInstructorAnnouncements = [
  {
    id: 'demo-ann-1',
    title: 'End of Semester Showcase',
    content: 'Reminder: The end of semester showcase is on April 15th. Please submit your student performance lineups by April 5th.',
    date: '2026-03-26',
    instructor: { name: 'Admin', initials: 'AD' },
    isNew: true,
    type: 'event' as const,
  },
  {
    id: 'demo-ann-2',
    title: 'New Curriculum Updates',
    content: 'We have updated the Beat Matching module with new video tutorials. Please review the changes and adjust your lesson plans accordingly.',
    date: '2026-03-24',
    instructor: { name: 'Admin', initials: 'AD' },
    isNew: true,
    type: 'update' as const,
  },
  {
    id: 'demo-ann-3',
    title: 'Studio Maintenance Schedule',
    content: 'Classroom 2 will be closed for equipment maintenance on April 1-2. Please reschedule any sessions during that time.',
    date: '2026-03-22',
    instructor: { name: 'Admin', initials: 'AD' },
    isNew: false,
    type: 'announcement' as const,
  },
  {
    id: 'demo-ann-4',
    title: 'New Equipment Training',
    content: 'A training session for the new Pioneer DDJ-REV7 controllers is scheduled for March 30th at 10 AM in Classroom 1.',
    date: '2026-03-20',
    instructor: { name: 'Admin', initials: 'AD' },
    isNew: false,
    type: 'event' as const,
  },
  {
    id: 'demo-ann-5',
    title: 'Payment Processing Update',
    content: 'March payments have been processed and should appear in your account within 3-5 business days.',
    date: '2026-03-18',
    instructor: { name: 'Admin', initials: 'AD' },
    isNew: false,
    type: 'update' as const,
  },
];
