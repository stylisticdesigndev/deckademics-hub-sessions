import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Book, Edit, Plus, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCurriculumModules } from '@/hooks/useCurriculumModules';
import { useCurriculumLessons } from '@/hooks/useCurriculumLessons';
import { useCreateCurriculumModule } from '@/hooks/useCreateCurriculumModule';
import { useUpdateCurriculumModule } from '@/hooks/useUpdateCurriculumModule';
import { useDeleteCurriculumModule } from '@/hooks/useDeleteCurriculumModule';
import { useCreateCurriculumLesson } from '@/hooks/useCreateCurriculumLesson';
import { useUpdateCurriculumLesson } from '@/hooks/useUpdateCurriculumLesson';
import { useDeleteCurriculumLesson } from '@/hooks/useDeleteCurriculumLesson';

const AdminCurriculum = () => {
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  
  const { data: allModules = [], isLoading } = useCurriculumModules();
  const { data: allLessons = [] } = useCurriculumLessons();
  
  const createModule = useCreateCurriculumModule();
  const updateModule = useUpdateCurriculumModule();
  const deleteModule = useDeleteCurriculumModule();
  
  const createLesson = useCreateCurriculumLesson();
  const updateLesson = useUpdateCurriculumLesson();
  const deleteLesson = useDeleteCurriculumLesson();

  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null);

  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    order_index: 0
  });

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    order_index: 0
  });

  const handleAddModule = () => {
    const maxOrder = allModules
      .filter(m => m.level === newModule.level)
      .reduce((max, m) => Math.max(max, m.order_index), 0);
    
    createModule.mutate(
      { ...newModule, order_index: maxOrder + 1 },
      {
        onSuccess: () => {
          setNewModule({ title: '', description: '', level: 'beginner', order_index: 0 });
          setIsAddModuleOpen(false);
        }
      }
    );
  };

  const handleUpdateModule = () => {
    if (!editingModule) return;
    updateModule.mutate(editingModule, {
      onSuccess: () => setEditingModule(null)
    });
  };

  const handleDeleteModule = (id: string) => {
    deleteModule.mutate(id);
  };

  const handleAddLesson = () => {
    if (!addLessonModuleId) return;
    
    const moduleLessons = allLessons.filter(l => l.module_id === addLessonModuleId);
    const maxOrder = moduleLessons.reduce((max, l) => Math.max(max, l.order_index), 0);
    
    createLesson.mutate(
      {
        module_id: addLessonModuleId,
        ...newLesson,
        order_index: maxOrder + 1
      },
      {
        onSuccess: () => {
          setNewLesson({ title: '', description: '', order_index: 0 });
          setAddLessonModuleId(null);
        }
      }
    );
  };

  const handleUpdateLesson = () => {
    if (!editingLesson) return;
    updateLesson.mutate(editingLesson, {
      onSuccess: () => setEditingLesson(null)
    });
  };

  const handleDeleteLesson = (id: string) => {
    deleteLesson.mutate(id);
  };

  const getModulesByLevel = (level: string) => 
    allModules.filter(m => m.level === level).sort((a, b) => a.order_index - b.order_index);

  const getLessonsForModule = (moduleId: string) =>
    allLessons.filter(l => l.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading curriculum...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Curriculum Management</h1>
            <p className="text-muted-foreground">Manage modules and lessons for different experience levels</p>
          </div>
          
          <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Add New Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Module</DialogTitle>
                <DialogDescription>
                  Create a new curriculum module for students to complete.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="module-title">Module Title</Label>
                  <Input
                    id="module-title"
                    value={newModule.title}
                    onChange={e => setNewModule({...newModule, title: e.target.value})}
                    placeholder="e.g. Beat Mixing Fundamentals"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="module-description">Description</Label>
                  <Textarea
                    id="module-description"
                    value={newModule.description}
                    onChange={e => setNewModule({...newModule, description: e.target.value})}
                    placeholder="Describe what students will learn in this module"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="module-level">Experience Level</Label>
                  <Select
                    value={newModule.level}
                    onValueChange={value => setNewModule({...newModule, level: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddModuleOpen(false)}>Cancel</Button>
                <Button onClick={handleAddModule} disabled={!newModule.title}>Save Module</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Module Dialog */}
        <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
              <DialogDescription>Update this curriculum module.</DialogDescription>
            </DialogHeader>
            {editingModule && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Module Title</Label>
                  <Input
                    value={editingModule.title}
                    onChange={e => setEditingModule({...editingModule, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingModule.description || ''}
                    onChange={e => setEditingModule({...editingModule, description: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Experience Level</Label>
                  <Select
                    value={editingModule.level}
                    onValueChange={value => setEditingModule({...editingModule, level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingModule(null)}>Cancel</Button>
              <Button onClick={handleUpdateModule}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Lesson Dialog */}
        <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Lesson</DialogTitle>
              <DialogDescription>Update this curriculum lesson.</DialogDescription>
            </DialogHeader>
            {editingLesson && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Lesson Title</Label>
                  <Input
                    value={editingLesson.title}
                    onChange={e => setEditingLesson({...editingLesson, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingLesson.description || ''}
                    onChange={e => setEditingLesson({...editingLesson, description: e.target.value})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLesson(null)}>Cancel</Button>
              <Button onClick={handleUpdateLesson}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Lesson Dialog */}
        <Dialog open={!!addLessonModuleId} onOpenChange={(open) => !open && setAddLessonModuleId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lesson</DialogTitle>
              <DialogDescription>Create a new lesson for the module.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Lesson Title</Label>
                <Input
                  value={newLesson.title}
                  onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                  placeholder="e.g. Beat Counting Techniques"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={newLesson.description}
                  onChange={e => setNewLesson({...newLesson, description: e.target.value})}
                  placeholder="Describe what students will learn in this lesson"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddLessonModuleId(null)}>Cancel</Button>
              <Button onClick={handleAddLesson} disabled={!newLesson.title}>Add Lesson</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)} className="w-full">
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
                    <h3 className="font-medium text-lg">No modules yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Add your first {level} module to get started
                    </p>
                  </div>
                </Card>
              ) : (
                getModulesByLevel(level).map((module) => (
                  <Card key={module.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle>{module.title}</CardTitle>
                            <Badge variant="secondary">{module.level}</Badge>
                          </div>
                          <CardDescription>{module.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingModule(module)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModule(module.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Lessons</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddLessonModuleId(module.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Lesson
                          </Button>
                        </div>
                        {getLessonsForModule(module.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No lessons yet</p>
                        ) : (
                          <div className="space-y-2">
                            {getLessonsForModule(module.id).map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                              >
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium">{lesson.title}</h5>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {lesson.description}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingLesson(lesson)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
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

export default AdminCurriculum;
