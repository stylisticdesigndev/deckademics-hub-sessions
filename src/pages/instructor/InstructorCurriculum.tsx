import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, BookOpen } from 'lucide-react';
import { useCurriculumModules } from '@/hooks/useCurriculumModules';
import { useCurriculumLessons } from '@/hooks/useCurriculumLessons';

const InstructorCurriculum = () => {
  const { data: allModules = [], isLoading } = useCurriculumModules();
  const { data: allLessons = [] } = useCurriculumLessons();

  const getModulesByLevel = (level: string) =>
    allModules.filter(m => m.level === level).sort((a, b) => a.order_index - b.order_index);

  const getLessonsForModule = (moduleId: string) =>
    allLessons.filter(l => l.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading curriculum...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Teaching Curriculum</h1>
          <p className="text-muted-foreground">Reference guide for student instruction</p>
        </div>

        <Tabs defaultValue="beginner" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {['beginner', 'intermediate', 'advanced'].map(level => (
            <TabsContent key={level} value={level} className="space-y-4">
              {getModulesByLevel(level).length === 0 ? (
                <Card className="text-center p-6">
                  <div className="flex flex-col items-center justify-center space-y-2 py-6">
                    <Book className="h-12 w-12 text-muted-foreground/40" />
                    <h3 className="font-medium text-lg">No modules available</h3>
                    <p className="text-sm text-muted-foreground">
                      No {level} curriculum content yet
                    </p>
                  </div>
                </Card>
              ) : (
                getModulesByLevel(level).map((module, index) => (
                  <Card key={module.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                              {index + 1}
                            </span>
                            <CardTitle>{module.title}</CardTitle>
                            <Badge variant="secondary">{module.level}</Badge>
                          </div>
                          <CardDescription className="ml-10">{module.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 ml-10">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Lessons ({getLessonsForModule(module.id).length})
                        </h4>
                        {getLessonsForModule(module.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No lessons yet</p>
                        ) : (
                          <div className="space-y-2">
                            {getLessonsForModule(module.id).map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                                  {lessonIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium">{lesson.title}</h5>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {lesson.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InstructorCurriculum;
