
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart, PlusCircle, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mockSkills } from '@/data/mockDashboardData';

interface SkillWithProficiency {
  skill_name: string;
  proficiency: number;
  description: string | null;
}

interface CurriculumLesson {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
}

interface CurriculumModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons: CurriculumLesson[];
}

const StudentProgress = () => {
  const { userData, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillWithProficiency[]>([]);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  
  const isNewUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  const userId = session?.user?.id;
  
  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // 1. Get student's level
        const { data: studentData } = await supabase
          .from('students')
          .select('level')
          .eq('id', userId)
          .single();
        
        const level = studentData?.level || 'novice';
        
        // 2. Fetch admin-defined skills for this level
        const { data: progressSkills } = await supabase
          .from('progress_skills' as any)
          .select('name, description, order_index')
          .eq('level', level)
          .order('order_index', { ascending: true });
        
        // 3. Fetch student_progress records
        const { data: studentProgress } = await supabase
          .from('student_progress')
          .select('skill_name, proficiency')
          .eq('student_id', userId);
        
        // 4. Match skills against admin-defined ones
        const progressMap = new Map<string, number>();
        (studentProgress || []).forEach((sp: any) => {
          progressMap.set(sp.skill_name, sp.proficiency || 0);
        });
        
        const skillNames = new Set((progressSkills || []).map((ps: any) => ps.name));
        const matchedSkills: SkillWithProficiency[] = (progressSkills || []).map((ps: any) => ({
          skill_name: ps.name,
          proficiency: progressMap.get(ps.name) || 0,
          description: ps.description,
        }));
        
        setSkills(matchedSkills);
        
        // 5. Fetch curriculum modules & lessons for this level
        const { data: modulesData } = await supabase
          .from('curriculum_modules')
          .select('id, title, description, order_index')
          .eq('level', level)
          .order('order_index', { ascending: true });
        
        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id);
          const { data: lessonsData } = await supabase
            .from('curriculum_lessons')
            .select('id, title, order_index, module_id')
            .in('module_id', moduleIds)
            .order('order_index', { ascending: true });
          
          // Check which lessons are completed (stored in student_progress as "Module - Lesson" pattern)
          const completedLessonNames = new Set(
            (studentProgress || [])
              .filter((sp: any) => !skillNames.has(sp.skill_name))
              .map((sp: any) => sp.skill_name)
          );
          
          const builtModules: CurriculumModule[] = modulesData.map(mod => ({
            id: mod.id,
            title: mod.title,
            description: mod.description,
            order_index: mod.order_index,
            lessons: (lessonsData || [])
              .filter((l: any) => l.module_id === mod.id)
              .map((l: any) => ({
                id: l.id,
                title: l.title,
                order_index: l.order_index,
                completed: completedLessonNames.has(`${mod.title} - ${l.title}`) || completedLessonNames.has(l.title),
              })),
          }));
          
          setModules(builtModules);
        } else {
          setModules([]);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userId]);

  const activeSkills = demoMode ? mockSkills : skills;
  const isLoading = !demoMode && loading;
  
  const averageProgress = activeSkills.length > 0 
    ? Math.round(activeSkills.reduce((sum, item) => sum + (item.proficiency || 0), 0) / activeSkills.length) 
    : 0;
  
  return (
    <>
      <div className="space-y-6">
        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Learning Progress</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress through the DJ school curriculum
            </p>
          </div>
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
            className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        </section>

        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>
              Showing sample progress data. Click "Live Data" to switch back.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        ) : activeSkills.length > 0 || modules.length > 0 ? (
          <div className="space-y-6">
            {/* Overall Progress */}
            {activeSkills.length > 0 && (
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
            )}
            
            {/* Skills Breakdown */}
            {activeSkills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills Breakdown</CardTitle>
                  <CardDescription>
                    Your proficiency by individual skill
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeSkills.map((skill, index) => (
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
            )}

            {/* Curriculum Modules */}
            {!demoMode && modules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Curriculum Modules
                  </CardTitle>
                  <CardDescription>
                    Your lesson completion progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {modules.map((mod) => {
                    const completedCount = mod.lessons.filter(l => l.completed).length;
                    const totalCount = mod.lessons.length;
                    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    
                    return (
                      <div key={mod.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{mod.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {completedCount}/{totalCount} lessons
                          </span>
                        </div>
                        <ProgressBar value={pct} max={100} />
                        <div className="space-y-1 pl-2">
                          {mod.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-2 text-sm">
                              {lesson.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className={lesson.completed ? 'text-muted-foreground line-through' : ''}>
                                {lesson.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
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
      </div>
    </>
  );
};

export default StudentProgress;
