import { createClient } from 'jsr:@supabase/supabase-js@2'
import { generateAuthenticationOptions } from 'npm:@simplewebauthn/server@11.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function getRpInfo(req: Request) {
  const origin = req.headers.get('origin') || ''
  let host = ''
  try {
    host = new URL(origin).hostname
  } catch {
    host = ''
  }
  return { origin, rpID: host || 'localhost' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => ({}))
    const email = (body?.email || '').trim().toLowerCase()

    let allowCredentials: { id: string; transports?: string[] }[] = []
    let userId: string | null = null

    if (email) {
      // Resolve user via profiles
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      if (profile?.id) {
        userId = profile.id
        const { data: creds } = await admin
          .from('user_passkeys')
          .select('credential_id, transports')
          .eq('user_id', userId)
        allowCredentials = (creds || []).map((c: any) => ({
          id: c.credential_id,
          transports: c.transports || undefined,
        }))
      }
    }

    const { rpID, origin } = getRpInfo(req)

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    })

    await admin.from('passkey_challenges').insert({
      user_id: userId,
      email: email || null,
      challenge: options.challenge,
      type: 'authentication',
    })

    return new Response(JSON.stringify({ options, rpID, origin }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('passkey-auth-options error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
