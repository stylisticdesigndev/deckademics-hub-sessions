import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash, Info, GripVertical } from 'lucide-react';
import { useProgressSkills, ProgressSkill } from '@/hooks/useProgressSkills';
import { useCreateProgressSkill } from '@/hooks/useCreateProgressSkill';
import { useUpdateProgressSkill } from '@/hooks/useUpdateProgressSkill';
import { useDeleteProgressSkill } from '@/hooks/useDeleteProgressSkill';

const LEVELS = ['novice', 'amateur', 'intermediate', 'advanced'] as const;

const AdminSkills = () => {
  const [selectedLevel, setSelectedLevel] = useState<string>('novice');
  const { data: allSkills = [], isLoading } = useProgressSkills();
  
  const createSkill = useCreateProgressSkill();
  const updateSkill = useUpdateProgressSkill();
  const deleteSkill = useDeleteProgressSkill();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<ProgressSkill | null>(null);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', level: 'novice' });

  const getSkillsByLevel = (level: string) =>
    allSkills.filter(s => s.level === level).sort((a, b) => a.order_index - b.order_index);

  const handleAdd = () => {
    const levelSkills = getSkillsByLevel(newSkill.level);
    const maxOrder = levelSkills.reduce((max, s) => Math.max(max, s.order_index), 0);
    createSkill.mutate(
      { name: newSkill.name, level: newSkill.level, description: newSkill.description || undefined, order_index: maxOrder + 1 },
      { onSuccess: () => { setNewSkill({ name: '', description: '', level: selectedLevel }); setIsAddOpen(false); } }
    );
  };

  const handleUpdate = () => {
    if (!editingSkill) return;
    updateSkill.mutate(
      { id: editingSkill.id, name: editingSkill.name, description: editingSkill.description, order_index: editingSkill.order_index },
      { onSuccess: () => setEditingSkill(null) }
    );
  };

  const handleDelete = (id: string) => {
    deleteSkill.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading skills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Skills Management</h1>
          <p className="text-muted-foreground">Define trackable skills for each level that instructors can assess</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How Skills Work</AlertTitle>
        <AlertDescription>
          Skills you create here appear on the instructor's student view and on each student's progress page. 
          Instructors set proficiency percentages for each skill per student. This is separate from the 
          Curriculum page, which serves as a reference overview of what's taught at each level.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setNewSkill(prev => ({ ...prev, level: selectedLevel }))}>
              <Plus className="mr-1 h-4 w-4" /> Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Skill</DialogTitle>
              <DialogDescription>Create a trackable skill for a specific level.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Skill Name</Label>
                <Input
                  value={newSkill.name}
                  onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="e.g. Beat Juggling, Double Click Flare"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newSkill.description}
                  onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="Describe what this skill covers"
                />
              </div>
              <div className="grid gap-2">
                <Label>Level</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newSkill.level}
                  onChange={e => setNewSkill({ ...newSkill, level: e.target.value })}
                >
                  {LEVELS.map(l => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!newSkill.name.trim() || createSkill.isPending}>
                {createSkill.isPending ? 'Adding...' : 'Add Skill'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Skill Dialog */}
      <Dialog open={!!editingSkill} onOpenChange={(open) => !open && setEditingSkill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>Update this skill.</DialogDescription>
          </DialogHeader>
          {editingSkill && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Skill Name</Label>
                <Input
                  value={editingSkill.name}
                  onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={editingSkill.description || ''}
                  onChange={e => setEditingSkill({ ...editingSkill, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSkill(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateSkill.isPending}>
              {updateSkill.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {LEVELS.map(l => (
            <TabsTrigger key={l} value={l}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
              {getSkillsByLevel(l).length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({getSkillsByLevel(l).length})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {LEVELS.map(level => (
          <TabsContent key={level} value={level} className="space-y-3">
            {getSkillsByLevel(level).length === 0 ? (
              <Card className="text-center p-6">
                <div className="flex flex-col items-center justify-center space-y-2 py-6">
                  <GripVertical className="h-12 w-12 text-muted-foreground/40" />
                  <h3 className="font-medium text-lg">No skills yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your first {level} skill to get started
                  </p>
                </div>
              </Card>
            ) : (
              getSkillsByLevel(level).map((skill) => (
                <Card key={skill.id}>
                  <CardContent className="flex items-start justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{skill.name}</h3>
                      {skill.description && (
                        <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditingSkill(skill)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(skill.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminSkills;
