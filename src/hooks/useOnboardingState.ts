import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Per-user completed tour tracking, backed by the `user_onboarding` table with
 * a localStorage cache for zero-flicker gating on first paint.
 */
const LS_KEY = (userId: string) => `deckademics-tours-seen-${userId}`;

function readLocal(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeLocal(userId: string, seen: Set<string>) {
  try {
    localStorage.setItem(LS_KEY(userId), JSON.stringify(Array.from(seen)));
  } catch {
    /* ignore */
  }
}

export function useOnboardingState() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [seen, setSeen] = useState<Set<string>>(() => (userId ? readLocal(userId) : new Set()));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSeen(new Set());
      setLoaded(false);
      return;
    }
    // Seed from local cache first for instant response.
    setSeen(readLocal(userId));

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('tour_id')
        .eq('user_id', userId);
      if (cancelled) return;
      if (!error && data) {
        const next = new Set(data.map((r: any) => r.tour_id as string));
        setSeen(next);
        writeLocal(userId, next);
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markSeen = useCallback(
    async (tourId: string) => {
      if (!userId) return;
      setSeen((prev) => {
        if (prev.has(tourId)) return prev;
        const next = new Set(prev);
        next.add(tourId);
        writeLocal(userId, next);
        return next;
      });
      await supabase
        .from('user_onboarding')
        .upsert({ user_id: userId, tour_id: tourId }, { onConflict: 'user_id,tour_id' });
    },
    [userId],
  );

  const resetTour = useCallback(
    async (tourId: string) => {
      if (!userId) return;
      setSeen((prev) => {
        if (!prev.has(tourId)) return prev;
        const next = new Set(prev);
        next.delete(tourId);
        writeLocal(userId, next);
        return next;
      });
      await supabase
        .from('user_onboarding')
        .delete()
        .eq('user_id', userId)
        .eq('tour_id', tourId);
    },
    [userId],
  );

  const resetAll = useCallback(async () => {
    if (!userId) return;
    setSeen(new Set());
    writeLocal(userId, new Set());
    await supabase.from('user_onboarding').delete().eq('user_id', userId);
  }, [userId]);

  const hasSeen = useCallback((tourId: string) => seen.has(tourId), [seen]);

  return { hasSeen, markSeen, resetTour, resetAll, loaded, seen };
}