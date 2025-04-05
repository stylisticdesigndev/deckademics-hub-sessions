
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Badge } from '@/components/ui/badge';
import { Award, BookOpen, Check, Clock, LockIcon, Music } from 'lucide-react';

const StudentProgress = () => {
  // Mock modules data
  const modules = [
    {
      id: '1',
      title: 'Introduction to DJ Equipment',
      description: 'Learn about the basic equipment used in DJing.',
      progress: 100,
      lessons: [
        { id: '1-1', title: 'Turntables & CDJs', completed: true },
        { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
        { id: '1-3', title: 'Headphones & Monitors', completed: true },
        { id: '1-4', title: 'Software Overview', completed: true },
      ],
      completed: true,
    },
    {
      id: '2',
      title: 'Beat Matching Fundamentals',
      description: 'Master the art of matching beats between tracks.',
      progress: 80,
      lessons: [
        { id: '2-1', title: 'Understanding BPM', completed: true },
        { id: '2-2', title: 'Manual Beat Matching', completed: true },
        { id: '2-3', title: 'Beat Matching with Software', completed: true },
        { id: '2-4', title: 'Troubleshooting Common Issues', completed: false },
      ],
      completed: false,
    },
    {
      id: '3',
      title: 'Basic Mixing Techniques',
      description: 'Learn essential mixing techniques to create smooth transitions.',
      progress: 60,
      lessons: [
        { id: '3-1', title: 'EQ Mixing', completed: true },
        { id: '3-2', title: 'Volume Fading', completed: true },
        { id: '3-3', title: 'Filter Effects', completed: false },
        { id: '3-4', title: 'Intro to Phrase Mixing', completed: false },
      ],
      completed: false,
    },
    {
      id: '4',
      title: 'Scratching Basics',
      description: 'Introduction to basic scratching techniques.',
      progress: 45,
      lessons: [
        { id: '4-1', title: 'Proper Handling of Vinyl', completed: true },
        { id: '4-2', title: 'Baby Scratch', completed: true },
        { id: '4-3', title: 'Forward & Back Scratch', completed: false },
        { id: '4-4', title: 'Scribble Scratch', completed: false },
      ],
      completed: false,
    },
    {
      id: '5',
      title: 'Music Theory for DJs',
      description: 'Learn music theory concepts relevant to DJing.',
      progress: 0,
      lessons: [
        { id: '5-1', title: 'Key Matching', completed: false },
        { id: '5-2', title: 'Musical Phrasing', completed: false },
        { id: '5-3', title: 'Song Structure', completed: false },
        { id: '5-4', title: 'Harmonic Mixing', completed: false },
      ],
      completed: false,
      locked: true,
    },
  ];

  // Calculate overall progress
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
  const completedLessons = modules.reduce((total, module) => 
    total + module.lessons.filter(lesson => lesson.completed).length, 0);
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);
  
  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Your Learning Progress</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress through the DJ school curriculum
          </p>
        </section>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Your progress through all DJ school modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <ProgressBar value={overallProgress} max={100} size="lg" showPercentage={false} className="flex-1" />
              <span className="text-lg font-bold">{overallProgress}%</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                <BookOpen className="h-5 w-5 text-deckademics-primary mb-1" />
                <span className="text-xs text-muted-foreground">Modules</span>
                <span className="text-lg font-bold">{modules.length}</span>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                <Music className="h-5 w-5 text-deckademics-primary mb-1" />
                <span className="text-xs text-muted-foreground">Lessons</span>
                <span className="text-lg font-bold">{totalLessons}</span>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                <Check className="h-5 w-5 text-deckademics-primary mb-1" />
                <span className="text-xs text-muted-foreground">Completed</span>
                <span className="text-lg font-bold">{completedLessons}</span>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                <Clock className="h-5 w-5 text-deckademics-primary mb-1" />
                <span className="text-xs text-muted-foreground">Hours</span>
                <span className="text-lg font-bold">32</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold">Curriculum Modules</h2>
        
        <div className="space-y-4">
          {modules.map((module) => (
            <Card key={module.id} className={module.locked ? "opacity-70" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {module.title}
                      {module.completed && (
                        <Badge className="bg-green-600 ml-2">
                          <Check className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      )}
                      {module.locked && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 ml-2">
                          <LockIcon className="h-3 w-3 mr-1" /> Locked
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <div className="rounded-full h-12 w-12 border-4 border-deckademics-primary flex items-center justify-center">
                    <span className="font-bold text-sm">{module.progress}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProgressBar value={module.progress} max={100} />
                
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {module.lessons.map((lesson) => (
                    <li 
                      key={lesson.id} 
                      className={`flex items-center p-2 rounded-md ${
                        lesson.completed ? "bg-deckademics-primary/10" : "bg-muted"
                      } ${module.locked ? "opacity-50" : ""}`}
                    >
                      <div className={`flex items-center justify-center h-6 w-6 rounded-full mr-2 ${
                        lesson.completed ? "bg-deckademics-primary text-white" : "bg-muted-foreground/20 text-muted-foreground"
                      }`}>
                        {lesson.completed ? <Check className="h-3 w-3" /> : null}
                      </div>
                      <span className={`text-sm ${lesson.completed ? "font-medium" : ""}`}>
                        {lesson.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProgress;
