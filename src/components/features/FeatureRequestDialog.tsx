/**
 * Feature Request Dialog — allows students and instructors to suggest new features
 * during beta. Submissions are stored in feature_requests and visible to admins.
 */
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, ImagePlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface FeatureRequestDialogProps {
  triggerVariant?: 'icon' | 'button';
}

const DEVICE_OPTIONS = [
  'Mobile',
  'iPad/Tablet',
  'Desktop',
];

export const FeatureRequestDialog = ({ triggerVariant = 'button' }: FeatureRequestDialogProps) => {
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
          .from('feature-screenshots')
          .upload(filePath, screenshotFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('feature-screenshots')
          .getPublicUrl(filePath);
        screenshot_url = urlData.publicUrl;
      }

      const { error } = await (supabase.from('feature_requests' as any) as any).insert({
        requester_id: session.user.id,
        requester_role: role,
        title: title.trim(),
        description: description.trim(),
        device_type: deviceType || null,
        screenshot_url,
      });

      if (error) throw error;

      toast({ title: 'Feature request submitted', description: 'Thanks for the suggestion! An admin will review it.' });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting feature request:', error);
      toast({ title: 'Error', description: 'Failed to submit feature request. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {triggerVariant === 'icon' ? (
          <Button variant="ghost" size="icon" title="Suggest a feature">
            <Lightbulb className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Suggest a Feature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Suggest a Feature</DialogTitle>
            <DialogDescription>
              Have an idea that would make Deckademics better? Tell us about it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feature-title">Title</Label>
              <Input
                id="feature-title"
                placeholder="Short name for your idea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-description">Description</Label>
              <Textarea
                id="feature-description"
                placeholder="What feature would you like? Why would it be useful? Any details that would help us build it."
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
              <Label>Mockup or Reference (optional)</Label>
              {screenshotPreview ? (
                <div className="relative inline-block">
                  <img src={screenshotPreview} alt="Mockup preview" className="max-h-32 rounded-md border" />
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
                  Attach Image
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !title.trim() || !description.trim()}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
