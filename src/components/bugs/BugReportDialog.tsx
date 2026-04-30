/**
 * Bug Report Dialog — allows students and instructors to submit bug reports.
 * Reports are stored in the bug_reports table and visible to admins.
 */
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bug, ImagePlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface BugReportDialogProps {
  triggerVariant?: 'icon' | 'button';
}

const DEVICE_OPTIONS = [
  'Mobile',
  'iPad/Tablet',
  'Desktop',
];

export const BugReportDialog = ({ triggerVariant = 'button' }: BugReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session, userData } = useAuth();
  const { toast } = useToast();

  const role = userData?.profile?.role || 'student';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 5MB.', variant: 'destructive' });
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const clearScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeviceType('');
    clearScreenshot();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !session?.user?.id) return;

    setSubmitting(true);
    try {
      let screenshot_url: string | null = null;

      if (screenshotFile) {
        const timestamp = Date.now();
        const safeName = screenshotFile.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_+/g, '_');
        const filePath = `${session.user.id}/${timestamp}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('bug-screenshots')
          .upload(filePath, screenshotFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('bug-screenshots')
          .getPublicUrl(filePath);
        screenshot_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('bug_reports').insert({
        reporter_id: session.user.id,
        reporter_role: role,
        title: title.trim(),
        description: description.trim(),
        device_type: deviceType || null,
        screenshot_url,
      });

      if (error) throw error;

      toast({ title: 'Bug report submitted', description: 'Thank you! An admin will review your report.' });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({ title: 'Error', description: 'Failed to submit bug report. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
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
                rows={4}
                maxLength={2000}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your device" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              {screenshotPreview ? (
                <div className="relative inline-block">
                  <img src={screenshotPreview} alt="Screenshot preview" className="max-h-32 rounded-md border" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={clearScreenshot}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  Attach Screenshot
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
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
