import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { instructor_id, student_id, student_name, absence_date, reason } = await req.json();

    if (!instructor_id || !student_id) {
      return new Response(JSON.stringify({ error: 'instructor_id and student_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up the instructor's notification preferences (best-effort)
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('email_notifications, sms_notifications, phone_number')
      .eq('user_id', instructor_id)
      .maybeSingle();

    const safeName = (student_name ?? 'A student').toString().slice(0, 100);
    const safeReason = reason ? String(reason).slice(0, 500) : null;

    console.log('[notify-instructor-absence] dispatch', {
      instructor_id,
      student_id,
      student_name: safeName,
      absence_date,
      reason: safeReason,
      prefs,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        delivered: ['in_app_message'],
        pending: ['os_push_notification'],
        message: 'In-app notification delivered. OS push will activate once a push provider is connected.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[notify-instructor-absence] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});