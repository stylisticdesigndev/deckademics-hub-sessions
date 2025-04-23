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
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Video, Trash, RefreshCw, AlertCircle, Info, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VideoBackground } from '@/components/background/VideoBackground';

const AdminSettings = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null);
  const { clearLocalStorage, session } = useAuth();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  // Reduce max allowable video size to 50MB due to Supabase limits
  const MAX_VIDEO_MB = 50;

  const handlePreviewToggle = () => setIsPreviewVisible(!isPreviewVisible);

  const { settings, isLoading, updateSettings } = useAppSettings();
  
  const form = useForm({
    defaultValues: {
      schoolName: '',
      notificationsEnabled: true,
      emailNotifications: false,
      pushNotifications: false,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        schoolName: settings.school_name,
        notificationsEnabled: settings.notifications_enabled,
        emailNotifications: settings.notification_channels === 'email' || settings.notification_channels === 'all',
        pushNotifications: settings.notification_channels === 'push' || settings.notification_channels === 'all',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: any) => {
    const notificationChannels = 
      data.notificationsEnabled
        ? (data.emailNotifications && data.pushNotifications 
            ? 'all' 
            : data.emailNotifications 
              ? 'email' 
              : data.pushNotifications 
                ? 'push' 
                : 'none')
        : 'none';

    await updateSettings.mutateAsync({
      school_name: data.schoolName,
      notifications_enabled: data.notificationsEnabled,
      notification_channels: notificationChannels,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Fetch latest background video from Supabase storage on mount
  useEffect(() => {
    async function fetchBackgroundVideo() {
      try {
        const { data, error } = await supabase.storage.from('background-videos').list('', { 
          sortBy: { column: 'created_at', order: 'desc' }, 
          limit: 1 
        });
        
        if (error) {
          console.error('Error fetching background video list:', error);
          setBackgroundVideoUrl('/lovable-uploads/dj-background.mp4');
          return;
        }
        
        const latestFile = data?.[0];
        if (latestFile) {
          console.log('Latest background video file:', latestFile);
          const { data: publicUrl } = supabase.storage.from('background-videos').getPublicUrl(latestFile.name);
          if (publicUrl?.publicUrl) {
            console.log('Setting background video URL to:', publicUrl.publicUrl);
            setBackgroundVideoUrl(publicUrl.publicUrl);
          } else {
            console.log('No public URL available, using default');
            setBackgroundVideoUrl('/lovable-uploads/dj-background.mp4');
          }
        } else {
          console.log('No video files found in storage, using default');
          setBackgroundVideoUrl('/lovable-uploads/dj-background.mp4');
        }
      } catch (err) {
        console.error('Unexpected error in fetchBackgroundVideo:', err);
        setBackgroundVideoUrl('/lovable-uploads/dj-background.mp4');
      }
    }
    fetchBackgroundVideo();
  }, []);

  // Uploads video to Supabase Storage
  const handleVideoUpload = async () => {
    if (!videoFile) {
      toast({
        title: 'No Video Selected',
        description: 'Please select a video file first.',
        variant: 'destructive'
      });
      return;
    }
    
    const fileSizeInMB = videoFile.size / (1024 * 1024);
    if (fileSizeInMB > MAX_VIDEO_MB) {
      toast({
        title: 'File Too Large',
        description: `Video file exceeds the ${MAX_VIDEO_MB}MB limit. Please choose a smaller file.`,
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    toast({ title: 'Upload Started', description: 'Uploading and processing video...' });

    try {
      // Give each upload a unique name (timestamp + admin id + original name)
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `background-${session?.user?.id || 'admin'}-${Date.now()}.${fileExt}`;
      
      console.log('Uploading video file:', fileName);

      // Upload to Supabase Storage
      const { data, error: uploadErr } = await supabase.storage.from('background-videos').upload(fileName, videoFile, { 
        upsert: true, 
        cacheControl: '3600'
      });
      
      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        throw uploadErr;
      }
      
      console.log('Upload successful:', data);

      // Get public URL
      const { data: publicUrlRes } = supabase.storage.from('background-videos').getPublicUrl(fileName);
      const videoUrl = publicUrlRes?.publicUrl || '/lovable-uploads/dj-background.mp4';
      
      console.log('Setting new background video URL:', videoUrl);
      setBackgroundVideoUrl(videoUrl);

      toast({
        title: 'Video Uploaded',
        description: "Background video was uploaded and set. It's now shared for all users!"
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

                  <FormField
                    control={form.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Push Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications in your browser
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
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Cloud Video Mode</AlertTitle>
                    <AlertDescription>
                      Videos are now stored in the cloud! After uploading here, all users will see the same background video instantly on any device.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Upload Size Restriction</AlertTitle>
                    <AlertDescription>
                      Due to Supabase storage limitations, video uploads are limited to {MAX_VIDEO_MB}MB maximum.
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
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
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          Upload &amp; Apply Video
                          <Video className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                  {videoFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected file: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      {videoFile.size / (1024 * 1024) > MAX_VIDEO_MB && (
                        <span className="text-destructive ml-2 font-medium">
                          File exceeds {MAX_VIDEO_MB}MB limit!
                        </span>
                      )}
                    </p>
                  )}
                  <FormDescription>
                    Upload a new background video for the landing page.<br />
                    Recommended size: 1920x1080, max {MAX_VIDEO_MB}MB.
                  </FormDescription>
                  {backgroundVideoUrl && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Current video:</h4>
                      <div className="aspect-video max-w-md rounded-md overflow-hidden bg-black/10">
                        <video 
                          src={backgroundVideoUrl}
                          className="w-full h-full object-contain"
                          controls
                          muted
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handlePreviewToggle} 
                        className="mt-2"
                      >
                        {isPreviewVisible ? 'Hide' : 'Show'} Full Preview
                      </Button>
                    </div>
                  )}
                  {isPreviewVisible && backgroundVideoUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                      <div className="relative max-w-4xl w-full h-full max-h-[80vh]">
                        <Button 
                          variant="outline" 
                          onClick={handlePreviewToggle}
                          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border-none"
                        >
                          Close Preview
                        </Button>
                        <VideoBackground videoSrc={backgroundVideoUrl} fallbackSrc={backgroundVideoUrl} />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">System Maintenance</h3>
                  <div className="flex flex-wrap items-center gap-4">
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
                  
                  {/* Debug information for troubleshooting */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-md border">
                    <h4 className="text-sm font-medium mb-2">Authentication Status:</h4>
                    <pre className="text-xs whitespace-pre-wrap bg-slate-100 p-2 rounded overflow-auto">
                      {session?.user ? `Logged in as: ${session.user.email || session.user.id}` : 'Not logged in'}
                    </pre>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="mt-4"
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
