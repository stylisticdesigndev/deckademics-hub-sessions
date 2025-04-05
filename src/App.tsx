
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/auth/Auth";

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
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
