import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget push notification. Never throws and never blocks the caller —
 * push delivery is a best-effort side effect of a user action. The edge function
 * itself checks the recipient's push opt-in and active subscriptions.
 */
export function notifyPush(
  recipientId: string | null | undefined,
  title: string,
  body: string,
  url = '/'
): void {
  if (!recipientId) return;
  try {
    void supabase.functions
      .invoke('send-push', {
        body: { recipient_id: recipientId, title, body, url },
      })
      .catch((err) => console.debug('[notifyPush] failed', err));
  } catch (err) {
    console.debug('[notifyPush] failed', err);
  }
}