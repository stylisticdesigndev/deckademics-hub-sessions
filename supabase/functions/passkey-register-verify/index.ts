import { createClient } from 'jsr:@supabase/supabase-js@2'
import { verifyRegistrationResponse } from 'npm:@simplewebauthn/server@11.0.0'

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

function deriveDeviceLabel(ua: string): string {
  if (!ua) return 'Unknown device'
  let device = 'Device'
  if (/iPhone/i.test(ua)) device = 'iPhone'
  else if (/iPad/i.test(ua)) device = 'iPad'
  else if (/Android/i.test(ua)) device = 'Android'
  else if (/Mac OS X/i.test(ua)) device = 'Mac'
  else if (/Windows/i.test(ua)) device = 'Windows'
  else if (/Linux/i.test(ua)) device = 'Linux'
  let browser = ''
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari'
  return browser ? `${device} — ${browser}` : device
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub as string
    const body = await req.json()
    const response = body?.response
    if (!response) {
      return new Response(JSON.stringify({ error: 'Missing response' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { rpID, origin } = getRpInfo(req)

    // Find latest unexpired registration challenge for this user
    const { data: challengeRow } = await admin
      .from('passkey_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!challengeRow) {
      return new Response(JSON.stringify({ error: 'Challenge expired or missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { credential } = verification.registrationInfo
    const credentialId = credential.id // base64url string
    const publicKey = credential.publicKey // Uint8Array
    const counter = credential.counter ?? 0
    const transports = response?.response?.transports || []

    const ua = req.headers.get('user-agent') || ''
    const deviceLabel = deriveDeviceLabel(ua)

    // Encode the Uint8Array public key as a Postgres bytea hex literal ('\x...').
    // supabase-js does NOT auto-serialize Uint8Array → bytea via PostgREST; it would
    // JSON-stringify the typed array into an object, corrupting the bytes.
    let hex = ''
    for (let i = 0; i < publicKey.length; i++) {
      hex += publicKey[i].toString(16).padStart(2, '0')
    }
    const publicKeyHex = '\\x' + hex

    const { error: insertErr } = await admin.from('user_passkeys').insert({
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKeyHex,
      counter,
      transports,
      device_label: deviceLabel,
      last_used_at: new Date().toISOString(),
    })

    if (insertErr) {
      console.error('Insert passkey error:', insertErr)
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cleanup the used challenge
    await admin.from('passkey_challenges').delete().eq('id', challengeRow.id)

    return new Response(JSON.stringify({ verified: true, deviceLabel }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('passkey-register-verify error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
