import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo/Logo';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-deckademics-dark">
      <header className="container flex h-20 items-center px-4 sm:px-6 lg:px-8">
        <Logo size="md" />
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex items-center">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Master the Art of DJing with <span className="text-deckademics-primary">Deckademics</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Learn from expert instructors, track your progress, and connect with a community of passionate DJs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center md:justify-end relative">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-deckademics-primary/20 relative animate-pulse-subtle">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-black border-8 border-deckademics-primary animate-spin-slow">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border bg-deckademics-darker/50 py-6">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-white">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-white">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
