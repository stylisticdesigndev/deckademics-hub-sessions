import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toursForRole, welcomeIdForRole, type Role } from '@/lib/tour/tours';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useToast } from '@/hooks/use-toast';
import { PlayCircle, RotateCcw, Compass } from 'lucide-react';

interface TourReplayCardProps {
  role: Role;
}

/**
 * Card that lets a user replay the welcome tour, jump to any per-page tour,
 * or reset all completions so tours auto-play again on next visit.
 *
 * Replay works by resetting the tour's completion state and navigating to the
 * page — the page's `useTour(auto)` picks it up and starts it.
 */
export const TourReplayCard: React.FC<TourReplayCardProps> = ({ role }) => {
  const navigate = useNavigate();
  const { resetTour, resetAll } = useOnboardingState();
  const { toast } = useToast();
  const tours = toursForRole(role);
  const [selected, setSelected] = useState<string>(tours[0]?.id ?? '');

  const handleReplay = async () => {
    const tour = tours.find((t) => t.id === selected);
    if (!tour) return;
    await resetTour(tour.id);
    navigate(tour.path);
  };

  const handleReplayWelcome = async () => {
    await resetTour(welcomeIdForRole(role));
    // Welcome shows on the dashboard.
    const dashPath = `/${role}/dashboard`;
    navigate(dashPath);
  };

  const handleResetAll = async () => {
    await resetAll();
    toast({
      title: 'Tours reset',
      description: 'Guided tours will auto-play again the next time you visit each page.',
    });
  };

  return (
    <Card data-tour="replay-tours-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Compass className="h-5 w-5 text-primary" />
          App walkthrough
        </CardTitle>
        <CardDescription>
          Replay any guided tour, or reset them all to auto-play again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleReplayWelcome}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Replay welcome
          </Button>
          <Button variant="outline" onClick={handleResetAll}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset all tours
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="sm:w-64">
              <SelectValue placeholder="Pick a tour…" />
            </SelectTrigger>
            <SelectContent>
              {tours.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleReplay} disabled={!selected}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Replay this tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TourReplayCard;