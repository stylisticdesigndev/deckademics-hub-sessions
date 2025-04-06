
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Book, Edit, Plus, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Types
interface Module {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
}

const AdminCurriculum = () => {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([
    {
      id: '1',
      title: 'Introduction to DJ Equipment',
      description: 'Learn about the basic equipment used in DJing.',
      level: 'beginner',
      lessons: [
        { id: '1-1', title: 'Turntables & CDJs', description: 'Understanding the primary tools for DJs' },
        { id: '1-2', title: 'DJ Mixers & Controllers', description: 'Learning about audio mixing equipment' },
        { id: '1-3', title: 'Headphones & Monitors', description: 'Audio monitoring essentials for DJs' },
        { id: '1-4', title: 'Software Overview', description: 'Introduction to DJ software platforms' },
      ],
    },
    {
      id: '2',
      title: 'Beat Matching Fundamentals',
      description: 'Master the art of matching beats between tracks.',
      level: 'beginner',
      lessons: [
        { id: '2-1', title: 'Understanding BPM', description: 'Learning about tempo and beats per minute' },
        { id: '2-2', title: 'Manual Beat Matching', description: 'Techniques for matching beats without software assistance' },
        { id: '2-3', title: 'Beat Matching with Software', description: 'Using DJ software for beat matching' },
        { id: '2-4', title: 'Troubleshooting Common Issues', description: 'Solving common beat matching problems' },
      ],
    },
    {
      id: '3',
      title: 'Basic Mixing Techniques',
      description: 'Learn essential mixing techniques to create smooth transitions.',
      level: 'intermediate',
      lessons: [
        { id: '3-1', title: 'EQ Mixing', description: 'Using equalization for cleaner transitions' },
        { id: '3-2', title: 'Volume Fading', description: 'Creating smooth transitions with volume control' },
        { id: '3-3', title: 'Filter Effects', description: 'Using filters for transitions and effects' },
        { id: '3-4', title: 'Intro to Phrase Mixing', description: 'Understanding musical phrasing in DJ transitions' },
      ],
    },
    {
      id: '4',
      title: 'Advanced Performance Techniques',
      description: 'Take your DJ skills to the professional level.',
      level: 'advanced',
      lessons: [
        { id: '4-1', title: 'Advanced Loop Techniques', description: 'Creative applications of loop features' },
        { id: '4-2', title: 'Harmonic Mixing Mastery', description: 'Advanced key mixing for perfect harmony' },
        { id: '4-3', title: 'Live Remixing', description: 'Creating unique versions of tracks on the fly' },
        { id: '4-4', title: 'Performance Effects', description: 'Using effects to enhance your live performances' },
      ],
    },
  ]);

  // State for new/editing modules and lessons
  const [newModule, setNewModule] = useState<Partial<Module>>({
    title: '',
    description: '',
    level: 'beginner',
    lessons: []
  });

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [moduleToAddLesson, setModuleToAddLesson] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    title: '',
    description: ''
  });

  // Function to add a new module
  const handleAddModule = () => {
    if (!newModule.title || !newModule.description) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title and description for the module.',
        variant: 'destructive'
      });
      return;
    }

    const moduleId = (modules.length + 1).toString();
    setModules([
      ...modules,
      {
        id: moduleId,
        title: newModule.title,
        description: newModule.description,
        level: newModule.level as 'beginner' | 'intermediate' | 'advanced',
        lessons: []
      }
    ]);

    setNewModule({
      title: '',
      description: '',
      level: 'beginner',
      lessons: []
    });

    toast({
      title: 'Module added',
      description: `${newModule.title} has been added to the curriculum.`
    });
  };

  // Function to delete a module
  const handleDeleteModule = (moduleId: string) => {
    setModules(modules.filter(module => module.id !== moduleId));
    
    toast({
      title: 'Module deleted',
      description: 'The module has been removed from the curriculum.'
    });
  };

  // Function to update a module
  const handleUpdateModule = () => {
    if (!editingModule) return;
    
    setModules(modules.map(module => 
      module.id === editingModule.id ? editingModule : module
    ));
    
    setEditingModule(null);
    
    toast({
      title: 'Module updated',
      description: `${editingModule.title} has been updated.`
    });
  };

  // Function to add a new lesson to a module
  const handleAddLesson = () => {
    if (!moduleToAddLesson || !newLesson.title) return;
    
    const targetModule = modules.find(module => module.id === moduleToAddLesson);
    if (!targetModule) return;
    
    const lessonId = `${moduleToAddLesson}-${targetModule.lessons.length + 1}`;
    const updatedLesson = {
      id: lessonId,
      title: newLesson.title,
      description: newLesson.description || ''
    };
    
    const updatedModules = modules.map(module => {
      if (module.id === moduleToAddLesson) {
        return {
          ...module,
          lessons: [...module.lessons, updatedLesson]
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    setModuleToAddLesson(null);
    setNewLesson({ title: '', description: '' });
    
    toast({
      title: 'Lesson added',
      description: `${newLesson.title} has been added to the curriculum.`
    });
  };

  // Function to delete a lesson
  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    
    toast({
      title: 'Lesson deleted',
      description: 'The lesson has been removed from the curriculum.'
    });
  };

  // Function to update a lesson
  const handleUpdateLesson = (moduleId: string) => {
    if (!editingLesson) return;
    
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.map(lesson => 
            lesson.id === editingLesson.id ? editingLesson : lesson
          )
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    setEditingLesson(null);
    
    toast({
      title: 'Lesson updated',
      description: 'The lesson has been updated successfully.'
    });
  };

  // Get modules by level
  const getModulesByLevel = (level: string) => modules.filter(module => module.level === level);

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Curriculum Management</h1>
            <p className="text-muted-foreground">Manage modules and lessons for different experience levels</p>
          </div>
          
          <Dialog>
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
                    onValueChange={value => setNewModule({...newModule, level: value as 'beginner' | 'intermediate' | 'advanced'})}
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
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddModule}>Save Module</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Module Editor */}
        <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
              <DialogDescription>
                Update this curriculum module.
              </DialogDescription>
            </DialogHeader>
            {editingModule && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-module-title">Module Title</Label>
                  <Input
                    id="edit-module-title"
                    value={editingModule.title}
                    onChange={e => setEditingModule({...editingModule, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-module-description">Description</Label>
                  <Textarea
                    id="edit-module-description"
                    value={editingModule.description}
                    onChange={e => setEditingModule({...editingModule, description: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-module-level">Experience Level</Label>
                  <Select
                    value={editingModule.level}
                    onValueChange={value => setEditingModule({
                      ...editingModule, 
                      level: value as 'beginner' | 'intermediate' | 'advanced'
                    })}
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

        {/* Lesson Editor */}
        <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Lesson</DialogTitle>
              <DialogDescription>
                Update this curriculum lesson.
              </DialogDescription>
            </DialogHeader>
            {editingLesson && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-lesson-title">Lesson Title</Label>
                  <Input
                    id="edit-lesson-title"
                    value={editingLesson.title}
                    onChange={e => setEditingLesson({...editingLesson, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-lesson-description">Description</Label>
                  <Textarea
                    id="edit-lesson-description"
                    value={editingLesson.description}
                    onChange={e => setEditingLesson({...editingLesson, description: e.target.value})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLesson(null)}>Cancel</Button>
              <Button onClick={() => {
                const moduleId = editingLesson?.id.split('-')[0];
                handleUpdateLesson(moduleId);
              }}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Lesson Dialog */}
        <Dialog open={!!moduleToAddLesson} onOpenChange={(open) => !open && setModuleToAddLesson(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lesson</DialogTitle>
              <DialogDescription>
                Create a new lesson for the module.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lesson-title">Lesson Title</Label>
                <Input
                  id="lesson-title"
                  value={newLesson.title}
                  onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                  placeholder="e.g. Beat Counting Techniques"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lesson-description">Description</Label>
                <Textarea
                  id="lesson-description"
                  value={newLesson.description}
                  onChange={e => setNewLesson({...newLesson, description: e.target.value})}
                  placeholder="Describe what students will learn in this lesson"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModuleToAddLesson(null)}>Cancel</Button>
              <Button onClick={handleAddLesson}>Add Lesson</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    <h3 className="font-medium text-lg">No modules yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      Add your first {level} module to start building the curriculum.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="mt-2">
                          <Plus className="mr-1 h-4 w-4" /> Create Module
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {/* Reuse the add module form */}
                        <DialogHeader>
                          <DialogTitle>Add New Module</DialogTitle>
                          <DialogDescription>
                            Create a new curriculum module for students to complete.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`module-title-${level}`}>Module Title</Label>
                            <Input
                              id={`module-title-${level}`}
                              value={newModule.title}
                              onChange={e => setNewModule({...newModule, title: e.target.value, level: level as any})}
                              placeholder="e.g. Beat Mixing Fundamentals"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`module-description-${level}`}>Description</Label>
                            <Textarea
                              id={`module-description-${level}`}
                              value={newModule.description}
                              onChange={e => setNewModule({...newModule, description: e.target.value})}
                              placeholder="Describe what students will learn in this module"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleAddModule}>Save Module</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ) : (
                getModulesByLevel(level).map(module => (
                  <Card key={module.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {module.title}
                            <Badge variant="outline" className="ml-2 text-xs font-normal capitalize">
                              {module.level}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1.5">{module.description}</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingModule({...module})}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:text-destructive" 
                            onClick={() => handleDeleteModule(module.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium">Lessons ({module.lessons.length})</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setModuleToAddLesson(module.id)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Lesson
                        </Button>
                      </div>
                      
                      {module.lessons.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No lessons added yet. Add your first lesson to this module.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {module.lessons.map(lesson => (
                            <div 
                              key={lesson.id} 
                              className="flex items-start justify-between p-3 rounded-md border"
                            >
                              <div>
                                <div className="font-medium">{lesson.title}</div>
                                {lesson.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {lesson.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingLesson({...lesson})}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
