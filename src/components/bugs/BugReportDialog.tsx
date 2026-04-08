/**
 * Bug Report Dialog — allows students and instructors to submit bug reports.
 * Reports are stored in the bug_reports table and visible to admins.
 */
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface BugReportDialogProps {
  triggerVariant?: 'icon' | 'button';
}

export const BugReportDialog = ({ triggerVariant = 'button' }: BugReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { session, userData } = useAuth();
  const { toast } = useToast();

  const role = userData?.profile?.role || 'student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !session?.user?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('bug_reports' as any).insert({
        reporter_id: session.user.id,
        reporter_role: role,
        title: title.trim(),
        description: description.trim(),
      } as any);

      if (error) throw error;

      toast({ title: 'Bug report submitted', description: 'Thank you! An admin will review your report.' });
      setTitle('');
      setDescription('');
      setOpen(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({ title: 'Error', description: 'Failed to submit bug report. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === 'icon' ? (
          <Button variant="ghost" size="icon" title="Report a bug">
            <Bug className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Report Bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
            <DialogDescription>
              Describe the issue you encountered and we'll look into it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bug-title">Title</Label>
              <Input
                id="bug-title"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-description">Description</Label>
              <Textarea
                id="bug-description"
                placeholder="What happened? What were you trying to do? Include any steps to reproduce the issue."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={2000}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !title.trim() || !description.trim()}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
