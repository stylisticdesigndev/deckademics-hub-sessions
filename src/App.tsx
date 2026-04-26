import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentAuth from "./pages/auth/StudentAuth";
import InstructorAuth from "./pages/auth/InstructorAuth";
import ResetPassword from "./pages/auth/ResetPassword";

// Profile setup pages
import StudentProfileSetup from "./pages/student/StudentProfileSetup";
import StudentPhotoUpload from "./pages/student/StudentPhotoUpload";
import InstructorProfileSetup from "./pages/instructor/InstructorProfileSetup";
import InstructorPhotoUpload from "./pages/instructor/InstructorPhotoUpload";
import AdminProfileSetup from "./pages/admin/AdminProfileSetup";

// Layout routes
import StudentLayoutRoute from "./routes/StudentLayoutRoute";
import InstructorLayoutRoute from "./routes/InstructorLayoutRoute";
import AdminLayoutRoute from "./routes/AdminLayoutRoute";

// Student pages
import StudentDashboardGate from "./pages/student/StudentDashboardGate";
import StudentProgress from "./pages/student/StudentProgress";
import StudentClasses from "./pages/student/StudentClasses";
import StudentMessages from "./pages/student/StudentMessages";
import StudentProfile from "./pages/student/StudentProfile";
import StudentNotes from "./pages/student/StudentNotes";

// Instructor pages
import InstructorDashboardGate from "./pages/instructor/InstructorDashboardGate";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import InstructorStudentDetail from "./pages/instructor/InstructorStudentDetail";
import InstructorAnnouncements from "./pages/instructor/InstructorAnnouncements";
import InstructorClasses from "./pages/instructor/InstructorClasses";
import InstructorProfile from "./pages/instructor/InstructorProfile";
import InstructorMessages from "./pages/instructor/InstructorMessages";
import InstructorAttendance from "./pages/instructor/InstructorAttendance";

// Admin pages
import AdminDashboardGate from "./pages/admin/AdminDashboardGate";
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminInstructorPayments from "./pages/admin/AdminInstructorPayments";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCurriculum from "./pages/admin/AdminCurriculum";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminProgress from "./pages/admin/AdminProgress";
import AdminBugReports from "./pages/admin/AdminBugReports";
import StudentCurriculum from "./pages/student/StudentCurriculum";
import InstructorCurriculum from "./pages/instructor/InstructorCurriculum";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth">
          <Route index element={<Navigate to="/auth/student" replace />} />
          <Route path="student" element={<StudentAuth />} />
          <Route path="instructor" element={<InstructorAuth />} />
          {/* /auth/admin removed — all users use unified login */}
        </Route>
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Profile Setup Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/profile-setup" element={<StudentProfileSetup />} />
          <Route path="/student/photo-upload" element={<StudentPhotoUpload />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
          <Route path="/instructor/profile-setup" element={<InstructorProfileSetup />} />
          <Route path="/instructor/photo-upload" element={<InstructorPhotoUpload />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/profile-setup" element={<AdminProfileSetup />} />
        </Route>
        
        {/* Dashboard routes — gated: VinylLoader until all data is ready, then layout + content */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboardGate />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
          <Route path="/instructor/dashboard" element={<InstructorDashboardGate />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardGate />} />
        </Route>

        {/* Student routes - persistent layout */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<StudentLayoutRoute />}>
            <Route path="/student/progress" element={<StudentProgress />} />
            <Route path="/student/curriculum" element={<StudentCurriculum />} />
            <Route path="/student/notes" element={<StudentNotes />} />
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/messages" element={<StudentMessages />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>
        </Route>
        
        {/* Instructor routes - persistent layout (admin users can also access) */}
        <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
          <Route element={<InstructorLayoutRoute />}>
            <Route path="/instructor/students" element={<InstructorStudents />} />
            <Route path="/instructor/students/:studentId" element={<InstructorStudentDetail />} />
            <Route path="/instructor/curriculum" element={<InstructorCurriculum />} />
            <Route path="/instructor/announcements" element={<InstructorAnnouncements />} />
            <Route path="/instructor/classes" element={<InstructorClasses />} />
            <Route path="/instructor/attendance" element={<InstructorAttendance />} />
            <Route path="/instructor/profile" element={<InstructorProfile />} />
            <Route path="/instructor/messages" element={<InstructorMessages />} />
          </Route>
        </Route>
        
        {/* Admin routes - persistent layout */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayoutRoute />}>
            <Route path="/admin/instructors" element={<AdminInstructors />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/curriculum" element={<AdminCurriculum />} />
            <Route path="/admin/progress" element={<AdminProgress />} />
            <Route path="/admin/skills" element={<AdminSkills />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/instructor-payments" element={<AdminInstructorPayments />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/bug-reports" element={<AdminBugReports />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Default route for unknown paths */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
