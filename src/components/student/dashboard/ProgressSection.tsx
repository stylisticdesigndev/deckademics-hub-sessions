import React from 'react';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface SkillData {
  skill_name: string;
  proficiency: number;
}

interface ProgressSectionProps {
  totalProgress: number;
  skills?: SkillData[];
}

export const ProgressSection = ({ totalProgress, skills = [] }: ProgressSectionProps) => {
  const displayed = skills.slice(0, 4);
  const hasMore = skills.length > 4;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">Overall Progress</CardTitle>
          <Link to="/student/progress">
            <Button variant="link" size="sm" className="text-primary">
              View All Skills
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalProgress > 0 || displayed.length > 0 ? (
          <>
            <ProgressBar 
              value={totalProgress} 
              max={100} 
              size="lg"
              label="Total Skills" 
            />
            
            {displayed.length > 0 && (
              <div className="grid gap-3 grid-cols-1 mt-4">
                {displayed.map((skill) => (
                  <div key={skill.skill_name}>
                    <ProgressBar 
                      value={skill.proficiency} 
                      max={100} 
                      label={skill.skill_name} 
                    />
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="text-center pt-2">
                <Link to="/student/progress">
                  <Button variant="link" size="sm" className="text-primary">
                    +{skills.length - 4} more skills
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No progress data yet. Start a class to track your progress.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
