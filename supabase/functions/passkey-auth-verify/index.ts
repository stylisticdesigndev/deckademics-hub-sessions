import { createClient } from 'jsr:@supabase/supabase-js@2'
import { verifyAuthenticationResponse } from 'npm:@simplewebauthn/server@11.0.0'

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

// Decode bytea from supabase-js. Supabase returns bytea as a hex string ('\x...') by default.
function byteaToUint8Array(value: any): Uint8Array {
  if (value instanceof Uint8Array) return value
  if (typeof value === 'string') {
    if (value.startsWith('\\x')) {
      const hex = value.slice(2)
      const out = new Uint8Array(hex.length / 2)
      for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.substr(i * 2, 2), 16)
      }
      return out
    }
    // base64
    const bin = atob(value)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  if (value?.type === 'Buffer' && Array.isArray(value.data)) {
    return new Uint8Array(value.data)
  }
  throw new Error('Unsupported public_key encoding')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    const response = body?.response
    if (!response?.id) {
      return new Response(JSON.stringify({ error: 'Missing response' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const credentialId = response.id as string

    // Look up the stored passkey
    const { data: passkey, error: pkErr } = await admin
      .from('user_passkeys')
      .select('*')
      .eq('credential_id', credentialId)
      .maybeSingle()

    if (pkErr || !passkey) {
      return new Response(JSON.stringify({ error: 'Unknown passkey' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Latest unexpired authentication challenge
    const { data: challengeRow } = await admin
      .from('passkey_challenges')
      .select('*')
      .eq('type', 'authentication')
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

    const { rpID, origin } = getRpInfo(req)

    const publicKey = byteaToUint8Array(passkey.public_key)

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credential_id,
        publicKey,
        counter: Number(passkey.counter || 0),
        transports: passkey.transports || undefined,
      },
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update counter and last_used
    await admin
      .from('user_passkeys')
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', passkey.id)

    // Cleanup challenge
    await admin.from('passkey_challenges').delete().eq('id', challengeRow.id)

    // Look up user email to mint session
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', passkey.user_id)
      .maybeSingle()

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mint a session via magiclink → verifyOtp pattern
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    })
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('generateLink error:', linkErr)
      return new Response(JSON.stringify({ error: 'Failed to mint session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenHash = linkData.properties.hashed_token

    // Use anon client to verify OTP — returns access_token + refresh_token
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: sessionData, error: verifyErr } = await anonClient.auth.verifyOtp({
      type: 'magiclink',
      token_hash: tokenHash,
    })

    if (verifyErr || !sessionData?.session) {
      console.error('verifyOtp error:', verifyErr)
      return new Response(JSON.stringify({ error: 'Failed to mint session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        verified: true,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    console.error('passkey-auth-verify error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
