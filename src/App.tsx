
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentAuth from "./pages/auth/StudentAuth";
import InstructorAuth from "./pages/auth/InstructorAuth";
import AdminAuth from "./pages/auth/AdminAuth";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProgress from "./pages/student/StudentProgress";
import StudentClasses from "./pages/student/StudentClasses";
import StudentMessages from "./pages/student/StudentMessages";
import StudentProfile from "./pages/student/StudentProfile";

// Instructor pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import InstructorAnnouncements from "./pages/instructor/InstructorAnnouncements";
import InstructorClasses from "./pages/instructor/InstructorClasses";
import InstructorProfile from "./pages/instructor/InstructorProfile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminInstructorPayments from "./pages/admin/AdminInstructorPayments";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCurriculum from "./pages/admin/AdminCurriculum";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/student" element={<StudentAuth />} />
            <Route path="/auth/instructor" element={<InstructorAuth />} />
            <Route path="/auth/admin" element={<AdminAuth />} />
            
            {/* Student routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/progress" element={<StudentProgress />} />
              <Route path="/student/classes" element={<StudentClasses />} />
              <Route path="/student/messages" element={<StudentMessages />} />
              <Route path="/student/profile" element={<StudentProfile />} />
            </Route>
            
            {/* Instructor routes */}
            <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
              <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
              <Route path="/instructor/students" element={<InstructorStudents />} />
              <Route path="/instructor/announcements" element={<InstructorAnnouncements />} />
              <Route path="/instructor/classes" element={<InstructorClasses />} />
              <Route path="/instructor/profile" element={<InstructorProfile />} />
            </Route>
            
            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/instructors" element={<AdminInstructors />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/curriculum" element={<AdminCurriculum />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/instructor-payments" element={<AdminInstructorPayments />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Default route for unknown paths */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
