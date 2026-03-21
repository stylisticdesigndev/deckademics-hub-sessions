
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart, Layers, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mockSkills } from '@/data/mockDashboardData';

const StudentProgress = () => {
  const { userData, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState([]);
  const [courseInfo, setCourseInfo] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  
  const isNewUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  const userId = session?.user?.id;
  
  useEffect(() => {
    async function fetchProgressData() {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        const { data: progress, error: progressError } = await supabase
          .from('student_progress')
          .select('*')
          .eq('student_id', userId);
          
        if (progressError) {
          console.error('Error fetching student progress:', progressError);
        } else {
          setProgressData(progress || []);
          
          if (progress && progress.length > 0 && progress[0].course_id) {
            const { data: course, error: courseError } = await supabase
              .from('courses')
              .select('*')
              .eq('id', progress[0].course_id)
              .single();
              
            if (courseError && courseError.code !== 'PGRST116') {
              console.error('Error fetching course info:', courseError);
            } else {
              setCourseInfo(course);
            }
          }
        }
      } catch (err) {
        console.error('Error in fetchProgressData:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProgressData();
  }, [userId]);

  const activeProgressData = demoMode ? mockSkills : progressData;
  const isLoading = !demoMode && loading;
  
  const averageProgress = activeProgressData.length > 0 
    ? Math.round(activeProgressData.reduce((sum, item) => sum + (item.proficiency || 0), 0) / activeProgressData.length) 
    : 0;
  
  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Learning Progress</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress through the DJ school curriculum
            </p>
          </div>
          {!demoMode && (
            <Button size="sm" variant="ghost" onClick={() => setDemoMode(true)} className="text-muted-foreground">
              <Eye className="h-4 w-4 mr-1" /> Demo
            </Button>
          )}
        </section>

        {demoMode && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Demo Mode — Showing sample data</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDemoMode(false)}>
              <EyeOff className="h-4 w-4 mr-1" /> Switch to Live Data
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        ) : activeProgressData.length > 0 ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  Your average proficiency across all skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Proficiency</span>
                    <span className="font-medium">{averageProgress}%</span>
                  </div>
                  <ProgressBar value={averageProgress} max={100} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Skills Breakdown</CardTitle>
                <CardDescription>
                  Your proficiency by individual skill
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeProgressData.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{skill.skill_name}</span>
                      <span className="font-medium">{skill.proficiency || 0}%</span>
                    </div>
                    <ProgressBar value={skill.proficiency || 0} max={100} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
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
        )}

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              What to expect in your DJ journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg flex flex-col items-center text-center">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Novice</h3>
                <p className="text-sm text-muted-foreground mt-1">Learn the fundamentals of DJ equipment and basic music theory</p>
              </div>
              
              <div className="p-4 border rounded-lg flex flex-col items-center text-center">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Amateur</h3>
                <p className="text-sm text-muted-foreground mt-1">Build on basics with intro to mixing techniques and song structure</p>
              </div>
              
              <div className="p-4 border rounded-lg flex flex-col items-center text-center">
                <Layers className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Intermediate</h3>
                <p className="text-sm text-muted-foreground mt-1">Master beat matching, EQ control, and basic scratching techniques</p>
              </div>
              
              <div className="p-4 border rounded-lg flex flex-col items-center text-center">
                <BarChart className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Advanced</h3>
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
