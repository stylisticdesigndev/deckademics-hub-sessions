
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Video, Trash, RefreshCw } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const AdminSettings = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState(localStorage.getItem('backgroundVideoUrl') || '/lovable-uploads/dj-background.mp4');
  const { clearLocalStorage } = useAuth();
  
  // Check if the storage bucket exists
  const [bucketExists, setBucketExists] = useState(true);

  useEffect(() => {
    // Check if the bucket exists
    async function checkBucket() {
      try {
        const { data, error } = await supabase.storage.getBucket('background-videos');
        
        if (error) {
          console.error('Error checking bucket:', error);
          setBucketExists(false);
        } else {
          setBucketExists(true);
        }
      } catch (error) {
        console.error('Error checking bucket:', error);
        setBucketExists(false);
      }
    }
    
    checkBucket();
  }, []);

  const form = useForm({
    defaultValues: {
      schoolName: 'Deckademics DJ School',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: false,
    },
  });

  const onSubmit = (data: any) => {
    console.log(data);
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been successfully saved.',
    });
  };

  const handleVideoUpload = async () => {
    if (!videoFile) {
      toast({
        title: 'No Video Selected',
        description: 'Please select a video file first.',
        variant: 'destructive'
      });
      return;
    }

    // Check if file size exceeds limit (50MB)
    const fileSizeInMB = videoFile.size / (1024 * 1024);
    if (fileSizeInMB > 50) {
      toast({
        title: 'File Too Large',
        description: 'Video file exceeds the 50MB limit. Please choose a smaller file.',
        variant: 'destructive'
      });
      return;
    }

    // Check if bucket exists
    if (!bucketExists) {
      toast({
        title: 'Storage Not Available',
        description: 'The video storage is not configured correctly. Please contact support.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get the session to ensure we're authenticated
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session) {
        throw new Error('You must be logged in to upload videos');
      }

      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('background-videos')
        .upload(filePath, videoFile, {
          upsert: false,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('background-videos')
        .getPublicUrl(filePath);

      // Save URL to localStorage
      localStorage.setItem('backgroundVideoUrl', publicUrl);
      setBackgroundVideoUrl(publicUrl);

      toast({
        title: 'Video Uploaded',
        description: 'Background video successfully updated.',
      });
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'There was an error uploading the video.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearStorage = () => {
    clearLocalStorage();
    toast({
      title: 'Storage Cleared',
      description: 'Local storage has been cleared. You will be logged out.',
    });
  };

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage application settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure your school's general settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your school's display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Preferences</h3>
                  
                  <FormField
                    control={form.control}
                    name="notificationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Notifications
                          </FormLabel>
                          <FormDescription>
                            Receive notifications about important events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications via email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!form.watch('notificationsEnabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Background Video</h3>
                  <div className="flex items-center space-x-4">
                    <Input 
                      type="file" 
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setVideoFile(file);
                      }}
                      className="max-w-sm"
                    />
                    <Button 
                      type="button"
                      onClick={handleVideoUpload}
                      disabled={isUploading || !bucketExists}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Video'}
                      <Video className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Upload a new background video for the landing page. 
                    Recommended size: 1920x1080, max 50MB.
                    {!bucketExists && (
                      <span className="text-destructive block mt-1">
                        Storage bucket not available. Please check Supabase configuration.
                      </span>
                    )}
                  </FormDescription>
                </div>

                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">System Maintenance</h3>
                  <div className="flex items-center space-x-4">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={handleClearStorage}
                    >
                      Clear Local Storage
                      <Trash className="ml-2 h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Reload Application
                      <RefreshCw className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Use with caution! Clearing local storage will remove all cached data and log you out.
                  </FormDescription>
                </div>
                
                <Button type="submit" className="mt-4">Save Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
