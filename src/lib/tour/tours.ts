import type { TourStep } from '@/hooks/useTour';

/**
 * Tour ids are versioned so we can bump them if a tour is significantly rewritten
 * (users will re-see the updated tour once, then it's marked seen again).
 */
const V = 'v2';

type TourDef = { id: string; label: string; path: string; steps: TourStep[] };

const navSelector = (title: string) => `[data-tour="nav-${title}"]`;

// ---------- STUDENT ----------
export const STUDENT_TOURS: Record<string, TourDef> = {
  dashboard: {
    id: `student-dashboard-${V}`,
    label: 'Dashboard',
    path: '/student/dashboard',
    steps: [
      {
        popover: {
          title: 'Welcome to your dashboard',
          description: 'This is your home base. Everything you need — classes, skills, notes, messages — starts here.',
        },
      },
      {
        element: navSelector('Skills'),
        popover: {
          title: 'Skills',
          description: 'Track your progress across every skill in the DJ curriculum. Your instructor updates these after class.',
        },
      },
      {
        element: navSelector('Classes'),
        popover: {
          title: 'Classes',
          description: 'See your class schedule and attendance history in one place.',
        },
      },
      {
        element: navSelector('Notes'),
        popover: {
          title: 'Notes',
          description: 'Read notes from your instructor, and keep your own personal notes here too.',
        },
      },
      {
        element: navSelector('Messages'),
        popover: {
          title: 'Messages',
          description: 'Chat directly with your instructor — anytime, from any device.',
        },
      },
      {
        element: '[data-tour="header-notifications"]',
        popover: {
          title: 'Notifications',
          description: 'The bell shows unread messages and announcements. A red dot means something new is waiting.',
        },
      },
      {
        element: '[data-tour="header-bug"]',
        popover: {
          title: 'Report a bug',
          description: 'See something broken? Tap here to send a bug report — screenshots welcome.',
        },
      },
      {
        element: '[data-tour="header-feature"]',
        popover: {
          title: 'Request a feature',
          description: 'Have an idea to make Deckademics better? Send it here — we read every one.',
        },
      },
      {
        element: '[data-tour="sidebar-user-footer"]',
        popover: {
          title: 'Your profile',
          description: 'Click your name or avatar anytime to open your profile, update your photo, and manage settings.',
        },
      },
    ],
  },
  progress: {
    id: `student-progress-${V}`,
    label: 'Skills',
    path: '/student/progress',
    steps: [
      {
        popover: {
          title: 'Your Skills',
          description: 'Every skill is graded 0–100 by your instructor. Focus on the ones you want to level up.',
        },
      },
    ],
  },
  curriculum: {
    id: `student-curriculum-${V}`,
    label: 'Curriculum',
    path: '/student/curriculum',
    steps: [
      {
        popover: {
          title: 'Curriculum',
          description: 'The full DJ curriculum, broken down by level. Read ahead any time.',
        },
      },
    ],
  },
  classes: {
    id: `student-classes-${V}`,
    label: 'Classes',
    path: '/student/classes',
    steps: [
      {
        popover: {
          title: 'Classes & attendance',
          description: 'Your upcoming class is at the top. Below it you can review your attendance for past weeks.',
        },
      },
    ],
  },
  notes: {
    id: `student-notes-${V}`,
    label: 'Notes',
    path: '/student/notes',
    steps: [
      {
        popover: {
          title: 'Notes',
          description: 'Instructor notes and your own personal notes live here. Bookmark anything from Messages to save it as a note.',
        },
      },
    ],
  },
  messages: {
    id: `student-messages-${V}`,
    label: 'Messages',
    path: '/student/messages',
    steps: [
      {
        popover: {
          title: 'Messages',
          description: 'A direct chat with your instructor. You can reply within 7 days of their most recent message.',
        },
      },
    ],
  },
  announcements: {
    id: `student-announcements-${V}`,
    label: 'Announcements',
    path: '/student/announcements',
    steps: [
      {
        popover: {
          title: 'Announcements',
          description: 'School-wide updates from the admin team. Mark as read or dismiss when you\'re done.',
        },
      },
    ],
  },
  profile: {
    id: `student-profile-${V}`,
    label: 'Profile',
    path: '/student/profile',
    steps: [
      {
        popover: {
          title: 'Your profile',
          description: 'Update your info, upload a photo, manage notification preferences — and replay any walkthrough from here.',
        },
      },
      {
        element: '[data-tour="replay-tours-card"]',
        popover: {
          title: 'Replay tours',
          description: 'Forget how something works? Come back here to replay any page walkthrough.',
        },
      },
    ],
  },
};

// ---------- INSTRUCTOR ----------
export const INSTRUCTOR_TOURS: Record<string, TourDef> = {
  dashboard: {
    id: `instructor-dashboard-${V}`,
    label: 'Dashboard',
    path: '/instructor/dashboard',
    steps: [
      {
        popover: {
          title: 'Welcome, instructor',
          description: 'Your dashboard shows today\'s classes, your students, and quick stats at a glance.',
        },
      },
      {
        element: navSelector('Students'),
        popover: {
          title: 'Students',
          description: 'Your full roster. Tap any student to see their skills, notes, attendance, and assign tasks.',
        },
      },
      {
        element: navSelector('Attendance'),
        popover: {
          title: 'Attendance',
          description: 'Log Present or Absent for each student, each week.',
        },
      },
      {
        element: navSelector('Calendar'),
        popover: {
          title: 'Calendar',
          description: 'School-wide weekly view of every class in every classroom.',
        },
      },
      {
        element: navSelector('My Payment'),
        popover: {
          title: 'My Payment',
          description: 'Your ledger — every session credited to you, with your pay period totals.',
        },
      },
      {
        element: '[data-tour="header-notifications"]',
        popover: {
          title: 'Notifications',
          description: 'The bell shows unread messages and announcements. A red dot means something new is waiting.',
        },
      },
      {
        element: '[data-tour="header-bug"]',
        popover: {
          title: 'Report a bug',
          description: 'See something broken? Tap here to send a bug report — screenshots welcome.',
        },
      },
      {
        element: '[data-tour="header-feature"]',
        popover: {
          title: 'Request a feature',
          description: 'Have an idea to make Deckademics better? Send it here — we read every one.',
        },
      },
      {
        element: '[data-tour="sidebar-user-footer"]',
        popover: {
          title: 'Your profile',
          description: 'Click your name or avatar anytime to open your profile, update your DJ name, photo, and settings.',
        },
      },
    ],
  },
  students: {
    id: `instructor-students-${V}`,
    label: 'Students',
    path: '/instructor/students',
    steps: [
      {
        popover: {
          title: 'Your students',
          description: 'Click a student to open their profile, update skills, add notes, and assign tasks.',
        },
      },
    ],
  },
  attendance: {
    id: `instructor-attendance-${V}`,
    label: 'Attendance',
    path: '/instructor/attendance',
    steps: [
      {
        popover: {
          title: 'Attendance',
          description: 'Mark students Present (green) or Absent (red) for each weekly class.',
        },
      },
    ],
  },
  classes: {
    id: `instructor-classes-${V}`,
    label: 'Classes',
    path: '/instructor/classes',
    steps: [
      {
        popover: {
          title: 'Classes',
          description: 'Filter by Day, Week, or Month to see who\'s scheduled with you and when.',
        },
      },
    ],
  },
  calendar: {
    id: `instructor-calendar-${V}`,
    label: 'Calendar',
    path: '/instructor/calendar',
    steps: [
      {
        popover: {
          title: 'School calendar',
          description: 'Read-only view of every class this week. Click a slot to see who\'s in it.',
        },
      },
    ],
  },
  curriculum: {
    id: `instructor-curriculum-${V}`,
    label: 'Curriculum',
    path: '/instructor/curriculum',
    steps: [
      {
        popover: {
          title: 'Curriculum',
          description: 'Reference the full curriculum by level — Novice, Amateur, Intermediate, Advanced.',
        },
      },
    ],
  },
  messages: {
    id: `instructor-messages-${V}`,
    label: 'Messages',
    path: '/instructor/messages',
    steps: [
      {
        popover: {
          title: 'Messages',
          description: 'Chat with your students in a unified thread view.',
        },
      },
    ],
  },
  ledger: {
    id: `instructor-ledger-${V}`,
    label: 'My Payment',
    path: '/instructor/ledger',
    steps: [
      {
        popover: {
          title: 'My Payment',
          description: 'Every session credited to you — with pay period totals and history.',
        },
      },
    ],
  },
  profile: {
    id: `instructor-profile-${V}`,
    label: 'Profile',
    path: '/instructor/profile',
    steps: [
      {
        popover: {
          title: 'Your profile',
          description: 'Update your DJ name, contact info, teaching schedule, and notification preferences.',
        },
      },
      {
        element: '[data-tour="replay-tours-card"]',
        popover: {
          title: 'Replay tours',
          description: 'Come back here anytime to replay any page walkthrough.',
        },
      },
    ],
  },
};

// ---------- ADMIN ----------
export const ADMIN_TOURS: Record<string, TourDef> = {
  dashboard: {
    id: `admin-dashboard-${V}`,
    label: 'Dashboard',
    path: '/admin/dashboard',
    steps: [
      {
        popover: {
          title: 'Admin dashboard',
          description: 'A bird\'s-eye view: students, instructors, payments, and pending approvals.',
        },
      },
      {
        element: navSelector('Instructors'),
        popover: {
          title: 'Instructors',
          description: 'Approve pending instructors, edit their info, and assign students.',
        },
      },
      {
        element: navSelector('Students'),
        popover: {
          title: 'Students',
          description: 'Approve new signups, manage active/inactive students, and assign instructors.',
        },
      },
      {
        element: navSelector('Curriculum'),
        popover: {
          title: 'Curriculum',
          description: 'Author the modules and lessons students see in their curriculum.',
        },
      },
      {
        element: navSelector('Skills'),
        popover: {
          title: 'Skills',
          description: 'Manage the trackable 0–100 skills instructors grade — separate from curriculum content.',
        },
      },
    ],
  },
  instructors: {
    id: `admin-instructors-${V}`,
    label: 'Instructors',
    path: '/admin/instructors',
    steps: [
      {
        popover: {
          title: 'Instructor management',
          description: 'Approve, edit, or deactivate instructors. Deactivating safely unassigns their students.',
        },
      },
    ],
  },
  students: {
    id: `admin-students-${V}`,
    label: 'Students',
    path: '/admin/students',
    steps: [
      {
        popover: {
          title: 'Student management',
          description: 'Tabs for Active, Pending, and Inactive. Assign instructors and set class schedules.',
        },
      },
    ],
  },
  curriculum: {
    id: `admin-curriculum-${V}`,
    label: 'Curriculum',
    path: '/admin/curriculum',
    steps: [
      {
        popover: {
          title: 'Curriculum editor',
          description: 'Curriculum rubrics live here. They\'re strictly separate from trackable Skills assessments.',
        },
      },
    ],
  },
  skills: {
    id: `admin-skills-${V}`,
    label: 'Skills',
    path: '/admin/skills',
    steps: [
      {
        popover: {
          title: 'Skills catalog',
          description: 'The trackable skills instructors grade. Novice/Amateur/Intermediate use rubrics; Advanced is a single open proficiency.',
        },
      },
    ],
  },
  attendance: {
    id: `admin-attendance-${V}`,
    label: 'Attendance',
    path: '/admin/attendance',
    steps: [
      {
        popover: {
          title: 'Attendance overview',
          description: 'School-wide attendance across all classrooms and instructors.',
        },
      },
    ],
  },
  payments: {
    id: `admin-payments-${V}`,
    label: 'Student Payments',
    path: '/admin/payments',
    steps: [
      {
        popover: {
          title: 'Student payments',
          description: 'Batch installment plans, tiered pricing, and payment history.',
        },
      },
    ],
  },
  instructorPayments: {
    id: `admin-instructor-payments-${V}`,
    label: 'Instructor Payments',
    path: '/admin/instructor-payments',
    steps: [
      {
        popover: {
          title: 'Instructor payroll',
          description: 'Auto-generated payment grids, extras, and paid-terminal status.',
        },
      },
    ],
  },
  messages: {
    id: `admin-messages-${V}`,
    label: 'Messages',
    path: '/admin/messages',
    steps: [
      {
        popover: {
          title: 'Messages',
          description: 'Admin-side messaging across the school.',
        },
      },
    ],
  },
  announcements: {
    id: `admin-announcements-${V}`,
    label: 'Announcements',
    path: '/admin/announcements',
    steps: [
      {
        popover: {
          title: 'Announcements',
          description: 'Post categorized announcements. Users mark as read or dismiss per-item.',
        },
      },
    ],
  },
  bugReports: {
    id: `admin-bug-reports-${V}`,
    label: 'Bug Reports',
    path: '/admin/bug-reports',
    steps: [
      {
        popover: {
          title: 'Bug reports',
          description: 'Bugs submitted by users, with screenshots. Update status to clear the badge.',
        },
      },
    ],
  },
  featureRequests: {
    id: `admin-feature-requests-${V}`,
    label: 'Feature Requests',
    path: '/admin/feature-requests',
    steps: [
      {
        popover: {
          title: 'Feature requests',
          description: 'Ideas from users. Triage by status: open, planned, shipped, dismissed.',
        },
      },
    ],
  },
  settings: {
    id: `admin-settings-${V}`,
    label: 'Settings',
    path: '/admin/settings',
    steps: [
      {
        popover: {
          title: 'App settings',
          description: 'School-wide toggles like notifications and mock users.',
        },
      },
    ],
  },
  profile: {
    id: `admin-profile-${V}`,
    label: 'Profile',
    path: '/admin/profile',
    steps: [
      {
        popover: {
          title: 'Your profile',
          description: 'Manage your admin profile and replay walkthroughs.',
        },
      },
      {
        element: '[data-tour="replay-tours-card"]',
        popover: {
          title: 'Replay tours',
          description: 'Come back here anytime to replay any page walkthrough.',
        },
      },
    ],
  },
};

export const WELCOME_TOUR_IDS = {
  student: 'student-welcome-v1',
  instructor: 'instructor-welcome-v1',
  admin: 'admin-welcome-v1',
} as const;

export type Role = 'student' | 'instructor' | 'admin';

export function toursForRole(role: Role): TourDef[] {
  const map =
    role === 'student' ? STUDENT_TOURS :
    role === 'instructor' ? INSTRUCTOR_TOURS :
    ADMIN_TOURS;
  return Object.values(map);
}

export function welcomeIdForRole(role: Role): string {
  return WELCOME_TOUR_IDS[role];
}