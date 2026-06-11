import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

// Public VAPID key — safe to ship in the client.
const VAPID_PUBLIC_KEY =
  'BESayFuSJdm_mrq5cTBvUiwffM5FrTHHtJPDlHmPBlRQn41emEyx5edE7c8jyF7YI-g1lVAyQW5r8PxyaY6IZQo';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const isIOS = (): boolean =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

export const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true);

export const usePushNotifications = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const userId = session?.user?.id;

  const [supported] = useState<boolean>(isPushSupported());
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Determine current subscription state on mount.
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!supported) {
        if (active) setLoading(false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (active) setEnabled(!!sub && Notification.permission === 'granted');
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    };
    check();
    return () => {
      active = false;
    };
  }, [supported]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!supported || !userId) {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported on this device or browser.',
        variant: 'destructive',
      });
      return false;
    }

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission needed',
          description: 'Allow notifications in your browser to receive push alerts.',
          variant: 'destructive',
        });
        return false;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON();
      const endpoint = json.endpoint!;
      const p256dh = json.keys?.p256dh ?? '';
      const auth = json.keys?.auth ?? '';

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent.slice(0, 300),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );

      if (error) throw error;

      await supabase
        .from('notification_preferences')
        .upsert(
          { user_id: userId, push_notifications: true, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      setEnabled(true);
      toast({
        title: 'Push notifications on',
        description: 'You will now get alerts on this device.',
      });
      return true;
    } catch (err) {
      console.error('[push] enable error', err);
      toast({
        title: 'Could not enable push',
        description: (err as Error)?.message ?? 'Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setBusy(false);
    }
  }, [supported, userId, toast]);

  const disable = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }

      await supabase
        .from('notification_preferences')
        .upsert(
          { user_id: userId, push_notifications: false, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      setEnabled(false);
      return true;
    } catch (err) {
      console.error('[push] disable error', err);
      return false;
    } finally {
      setBusy(false);
    }
  }, [userId]);

  const toggle = useCallback(
    (next: boolean) => (next ? enable() : disable()),
    [enable, disable]
  );

  return {
    supported,
    enabled,
    loading,
    busy,
    enable,
    disable,
    toggle,
    needsHomeScreen: isIOS() && !isStandalone(),
  };
};