
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/cards/StatsCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { Search, Calendar, CheckCircle, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Empty students array for new instructor
  const [students, setStudents] = useState([]);
  
  // Get instructor name from auth provider
  const instructorName = userData.profile 
    ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim() 
    : 'Instructor';
  
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome, {instructorName}</h1>
          <p className="text-muted-foreground">
            Your dashboard is ready for you to start managing your students and classes.
          </p>
        </section>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Getting Started</AlertTitle>
          <AlertDescription>
            As a new instructor, you don't have any students or classes assigned yet. The admin will assign students to you soon.
          </AlertDescription>
        </Alert>

        <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard 
            title="Today's Classes"
            value="0"
            icon={<Calendar className="h-5 w-5" />}
            description="No classes scheduled yet"
          />
          <StatsCard 
            title="Average Progress"
            value="0%"
            icon={<CheckCircle className="h-5 w-5" />}
            description="No student data available"
          />
          <StatsCard 
            title="Total Students"
            value="0"
            icon={<Users className="h-5 w-5" />}
            description="No students assigned yet"
          />
        </section>

        <section>
          <Card>
            <CardHeader className="flex-row justify-between items-center pb-4">
              <CardTitle>Today's Students</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={students.length === 0}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-6 p-3 font-medium border-b text-xs sm:text-sm">
                  <div className="col-span-3">STUDENT</div>
                  <div className="col-span-1">PROGRESS</div>
                  <div className="col-span-1 text-center">LEVEL</div>
                  <div className="col-span-1 text-center">NOTES</div>
                </div>
                
                <div className="p-6 text-center text-muted-foreground">
                  No students assigned to you yet.
                </div>
              </div>
              
              <div className="mt-4 text-right">
                <Button onClick={() => navigate('/instructor/students')}>
                  View All Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
