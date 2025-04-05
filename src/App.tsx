
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/auth/Auth";
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

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminInstructorPayments from "./pages/admin/AdminInstructorPayments";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/student" element={<StudentAuth />} />
          <Route path="/auth/instructor" element={<InstructorAuth />} />
          <Route path="/auth/admin" element={<AdminAuth />} />
          
          {/* Student routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/progress" element={<StudentProgress />} />
          <Route path="/student/classes" element={<StudentClasses />} />
          <Route path="/student/messages" element={<StudentMessages />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          
          {/* Instructor routes */}
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/students" element={<InstructorStudents />} />
          <Route path="/instructor/announcements" element={<InstructorAnnouncements />} />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/instructors" element={<AdminInstructors />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/instructor-payments" element={<AdminInstructorPayments />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
