
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart, Layers, PlusCircle } from 'lucide-react';

const StudentProgress = () => {
  const { userData } = useAuth();
  
  // Check if user has completed their profile
  const isNewUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  
  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Your Learning Progress</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress through the DJ school curriculum
          </p>
        </section>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">No progress data yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            {isNewUser 
              ? "Complete your profile and enroll in a class to start tracking your progress."
              : "You haven't started any lessons yet. Enroll in a class to begin your journey."}
          </p>
          
          {isNewUser && (
            <div className="flex gap-4 mt-2">
              <Button asChild>
                <Link to="/student/profile">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Complete Your Profile
                </Link>
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              What to expect in your DJ journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg flex flex-col items-center text-center">
                <BookOpen className="h-8 w-8 text-deckademics-primary mb-2" />
                <h3 className="font-medium">Beginner Skills</h3>
                <p className="text-sm text-muted-foreground mt-1">Learn the fundamentals of DJ equipment and basic mixing techniques</p>
              </div>
              
              <div className="p-4 border rounded-lg flex flex-col items-center text-center">
                <Layers className="h-8 w-8 text-deckademics-primary mb-2" />
                <h3 className="font-medium">Intermediate Skills</h3>
                <p className="text-sm text-muted-foreground mt-1">Master beat matching, EQ control, and basic scratching techniques</p>
              </div>
              
              <div className="p-4 border rounded-lg flex flex-col items-center text-center">
                <BarChart className="h-8 w-8 text-deckademics-primary mb-2" />
                <h3 className="font-medium">Advanced Skills</h3>
                <p className="text-sm text-muted-foreground mt-1">Perfect advanced mixing, scratching, and performance techniques</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentProgress;
