import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public VAPID key is safe to keep in code; private key comes from a secret.
const VAPID_PUBLIC_KEY =
  'BESayFuSJdm_mrq5cTBvUiwffM5FrTHHtJPDlHmPBlRQn41emEyx5edE7c8jyF7YI-g1lVAyQW5r8PxyaY6IZQo';
const VAPID_SUBJECT = 'mailto:notify@deckademics.com';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require an authenticated caller (any logged-in user can trigger a notification
    // to another user as a side effect of a legitimate action).
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const recipient_id = body?.recipient_id as string | undefined;
    const title = (body?.title ?? 'Deckademics').toString().slice(0, 120);
    const message = (body?.body ?? '').toString().slice(0, 300);
    const url = (body?.url ?? '/').toString().slice(0, 500);

    if (!recipient_id) {
      return new Response(JSON.stringify({ error: 'recipient_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!privateKey) {
      return new Response(JSON.stringify({ error: 'Push not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Respect the recipient's push toggle (default false — they must opt in).
    const { data: prefs } = await admin
      .from('notification_preferences')
      .select('push_notifications')
      .eq('user_id', recipient_id)
      .maybeSingle();

    if (!prefs?.push_notifications) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'push_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', recipient_id);

    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'no_subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({ title, body: message, url });
    let delivered = 0;
    const staleIds: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          delivered++;
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            staleIds.push(s.id);
          } else {
            console.error('[send-push] send error', status, (err as Error)?.message);
          }
        }
      })
    );

    if (staleIds.length > 0) {
      await admin.from('push_subscriptions').delete().in('id', staleIds);
    }

    return new Response(
      JSON.stringify({ ok: true, delivered, removed: staleIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-push] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});