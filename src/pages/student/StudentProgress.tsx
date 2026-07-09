
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { BarChart, PlusCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MilestoneChip } from '@/components/progress/MilestoneChip';
import { computeReadiness } from '@/lib/skillMilestones';

interface SkillWithProficiency {
  skill_name: string;
  proficiency: number; // 0–3 milestone
  description: string | null;
  is_core: boolean;
}

const StudentProgress = () => {
  const { userData, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillWithProficiency[]>([]);
  
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
          .select('name, description, is_core, order_index')
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
        
        const matchedSkills: SkillWithProficiency[] = (progressSkills || []).map((ps: any) => ({
          skill_name: ps.name,
          proficiency: progressMap.get(ps.name) || 0,
          description: ps.description,
          is_core: ps.is_core ?? true,
        }));
        
        setSkills(matchedSkills);
      } catch (err) {
        console.error('Error in fetchData:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userId]);

  const activeSkills = skills;
  const isLoading = loading;

  const readiness = computeReadiness(
    activeSkills.map((s) => ({ proficiency: s.proficiency, is_core: s.is_core })),
  );
  
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
        </section>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        ) : activeSkills.length > 0 ? (
          <div className="space-y-6">
            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  Skills you've mastered at your current level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-bold tabular-nums">
                    {readiness.masteredCount} <span className="text-base font-medium text-muted-foreground">of {readiness.total} Mastered</span>
                  </span>
                  {readiness.isReady && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/50 px-3 py-1 text-sm font-medium text-green-500">
                      <Sparkles className="h-4 w-4" />
                      Ready to Advance
                    </span>
                  )}
                </div>
                {!readiness.isReady && readiness.total > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Master every Core skill and reach Proficient on the rest to advance to the next level.
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>
                  Your proficiency by individual skill
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSkills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      {skill.skill_name}
                      {skill.is_core && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Core</span>
                      )}
                    </span>
                    <MilestoneChip value={skill.proficiency || 0} />
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
      </div>
    </>
  );
};

export default StudentProgress;
