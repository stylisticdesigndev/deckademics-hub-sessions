
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VideoBackground } from '@/components/background/VideoBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string>('/lovable-uploads/dj-background.mp4');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function getLatestVideo() {
      setIsLoading(true);
      try {
        // List files in the bucket and pick the newest one:
        const { data, error } = await supabase.storage.from('background-videos').list('', { 
          sortBy: { column: 'created_at', order: 'desc' }, 
          limit: 1 
        });
        
        if (error) {
          console.error('Error fetching videos:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const { data: publicUrl } = supabase.storage.from('background-videos').getPublicUrl(data[0].name);
          if (publicUrl?.publicUrl) {
            console.log('Found video URL:', publicUrl.publicUrl);
            // Append a timestamp to bust browser cache
            const cacheBuster = `?timestamp=${Date.now()}`;
            setBackgroundVideoUrl(publicUrl.publicUrl + cacheBuster);
          }
        } else {
          console.log('No videos found, using default');
        }
      } catch (err) {
        console.error('Failed to fetch background video:', err);
        
        // If we've tried less than 3 times, retry after a delay
        if (retryCount < 3) {
          console.log(`Retrying video fetch. Attempt ${retryCount + 1}/3`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        } else {
          toast({
            title: "Video Load Error",
            description: "Could not load background video. Using default instead.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    getLatestVideo();
  }, [retryCount]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative">
      <VideoBackground 
        videoSrc={backgroundVideoUrl} 
        fallbackSrc="/lovable-uploads/dj-background.mp4" 
      />
      
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8 z-10 relative">
        {/* Header logo removed */}
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10 relative">
        <div className="w-full max-w-md space-y-6 bg-black/70 p-6 rounded-xl backdrop-blur-sm">
          <div className="text-center flex flex-col items-center space-y-2">
            <div className="mb-4">
              <img 
                src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png" 
                alt="Deckademics Logo" 
                className="h-28 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome to Deckademics DJ School
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Sign in to access your personalized DJ learning experience
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Button 
              className="w-full py-6 text-lg" 
              variant="outline" 
              size="lg"
              asChild
            >
              <Link to="/auth/student">
                Student Sign In
              </Link>
            </Button>
            
            <Button 
              className="w-full py-6 text-lg"
              variant="outline" 
              size="lg"
              asChild
            >
              <Link to="/auth/instructor">
                Instructor Sign In
              </Link>
            </Button>
          </div>
          
          <p className="text-center text-muted-foreground text-sm">
            Choose the appropriate sign in option above
          </p>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground z-10 relative bg-black/50 backdrop-blur-sm">
        © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
        <div className="mt-4">
          <Link 
            to="/auth/admin" 
            className="text-xs text-muted-foreground hover:text-deckademics-primary transition-colors"
          >
            Administrator Access
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
