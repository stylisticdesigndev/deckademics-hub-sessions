
import React from 'react';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ProgressSectionProps {
  totalProgress: number;
}

export const ProgressSection = ({ totalProgress }: ProgressSectionProps) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">Overall Progress</CardTitle>
          <Link to="/student/progress">
            <Button variant="link" size="sm" className="text-deckademics-primary">
              View All Progress
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalProgress > 0 ? (
          <>
            <ProgressBar 
              value={totalProgress} 
              max={100} 
              size="lg"
              label="Total Curriculum" 
            />
            
            <div className="grid gap-3 grid-cols-1 mt-4">
              <div>
                <ProgressBar 
                  value={0} 
                  max={100} 
                  label="Beat Matching" 
                />
              </div>
              <div>
                <ProgressBar 
                  value={0} 
                  max={100} 
                  label="Scratching" 
                />
              </div>
              <div>
                <ProgressBar 
                  value={0} 
                  max={100} 
                  label="Music Theory" 
                />
              </div>
              <div>
                <ProgressBar 
                  value={0} 
                  max={100} 
                  label="Equipment Management" 
                />
              </div>
            </div>
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
