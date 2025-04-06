
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Badge } from '@/components/ui/badge';
import { Award, BookOpen, Check, Clock, LockIcon, Music, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Mock instructors with feedback
  const instructorFeedback = [
    {
      id: 1,
      name: 'Professor Smith',
      specialization: 'Turntablism',
      modules: ['1', '2'],
      feedback: [
        { 
          moduleId: '1', 
          text: 'Excellent grasp of equipment basics. You're ready to move forward to more advanced concepts.', 
          date: '2025-03-25',
          rating: 5
        },
        { 
          moduleId: '2', 
          text: 'Great progress on beat matching. Work on consistency with manual beat matching before our next session.', 
          date: '2025-04-01',
          rating: 4
        }
      ]
    },
    {
      id: 2,
      name: 'DJ Mike',
      specialization: 'Scratching',
      modules: ['4'],
      feedback: [
        { 
          moduleId: '4', 
          text: 'Good start with scratching techniques. Focus on wrist movement control and timing.', 
          date: '2025-03-28',
          rating: 3
        }
      ]
    },
    {
      id: 3,
      name: 'Sarah Jones',
      specialization: 'Beat Mixing',
      modules: ['3'],
      feedback: [
        { 
          moduleId: '3', 
          text: 'Your EQ mixing is showing improvement. I'd like to see more practice with filter transitions.', 
          date: '2025-04-03',
          rating: 4
        }
      ]
    }
  ];

  // Calculate overall progress
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
  const completedLessons = modules.reduce((total, module) => 
    total + module.lessons.filter(lesson => lesson.completed).length, 0);
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  // State for expanded module view
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  
  // Function to get instructor feedback for a specific module
  const getModuleFeedback = (moduleId: string) => {
    const allFeedback = [];
    
    for (const instructor of instructorFeedback) {
      const feedback = instructor.feedback.filter(f => f.moduleId === moduleId);
      if (feedback.length > 0) {
        allFeedback.push({
          instructorName: instructor.name,
          instructorSpecialization: instructor.specialization,
          feedback: feedback[0]
        });
      }
    }
    
    return allFeedback;
  };

  // Get the expanded module
  const expandedModule = expandedModuleId ? modules.find(m => m.id === expandedModuleId) : null;
  const moduleFeedback = expandedModuleId ? getModuleFeedback(expandedModuleId) : [];
  
  // Render stars based on rating
  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={`text-sm ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}>
          ★
        </span>
      );
    }
    return <div className="flex space-x-0.5">{stars}</div>;
  };
  
  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        {expandedModuleId ? (
          // Expanded module view
          <>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpandedModuleId(null)} 
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to All Modules
              </Button>
            </div>
            
            <section>
              <h1 className="text-2xl font-bold">{expandedModule?.title}</h1>
              <p className="text-muted-foreground mt-2">{expandedModule?.description}</p>
            </section>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Module Progress</CardTitle>
                    <CardDescription>Your progress in this module</CardDescription>
                  </div>
                  <div className="rounded-full h-12 w-12 border-4 border-deckademics-primary flex items-center justify-center">
                    <span className="font-bold text-sm">{expandedModule?.progress}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar value={expandedModule?.progress || 0} max={100} size="lg" />
                
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3">Lessons</h3>
                  <ul className="space-y-3">
                    {expandedModule?.lessons.map((lesson) => (
                      <li 
                        key={lesson.id} 
                        className={`flex items-center p-3 rounded-md ${
                          lesson.completed ? "bg-deckademics-primary/10" : "bg-muted"
                        }`}
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
                </div>
              </CardContent>
            </Card>
            
            {moduleFeedback.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Instructor Feedback</CardTitle>
                  <CardDescription>
                    Review feedback from your instructors for this module
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {moduleFeedback.map((fb, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{fb.instructorName}</div>
                          <div className="text-sm text-muted-foreground">{fb.instructorSpecialization}</div>
                        </div>
                        {renderRatingStars(fb.feedback.rating)}
                      </div>
                      <div className="text-sm mt-2">{fb.feedback.text}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Provided on {new Date(fb.feedback.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          // Main progress overview
          <>
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

            <Tabs defaultValue="modules">
              <TabsList>
                <TabsTrigger value="modules">Modules Progress</TabsTrigger>
                <TabsTrigger value="feedback">Instructor Feedback</TabsTrigger>
              </TabsList>
              
              <TabsContent value="modules" className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold">Curriculum Modules</h2>
                
                <div className="space-y-4">
                  {modules.map((module) => (
                    <Card key={module.id} className={module.locked ? "opacity-70" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
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
                        
                        {!module.locked && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => setExpandedModuleId(module.id)}
                          >
                            View Details
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold">Instructor Feedback</h2>
                
                <div className="space-y-4">
                  {instructorFeedback.map(instructor => (
                    <Card key={instructor.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{instructor.name}</CardTitle>
                        <CardDescription>{instructor.specialization}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {instructor.feedback.map((feedback, idx) => {
                          const module = modules.find(m => m.id === feedback.moduleId);
                          
                          return (
                            <div key={idx} className="p-4 border rounded-md">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline">{module?.title}</Badge>
                                {renderRatingStars(feedback.rating)}
                              </div>
                              <p className="text-sm mt-2">{feedback.text}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Provided on {new Date(feedback.date).toLocaleDateString()}
                              </p>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProgress;
