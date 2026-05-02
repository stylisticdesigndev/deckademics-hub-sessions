import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  generateRegistrationOptions,
} from 'npm:@simplewebauthn/server@11.0.0'

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
    const userEmail = (claimsData.claims.email as string) || ''

    const admin = createClient(supabaseUrl, serviceKey)

    // Look up existing passkeys to exclude (so user doesn't double-register the same authenticator)
    const { data: existing } = await admin
      .from('user_passkeys')
      .select('credential_id, transports')
      .eq('user_id', userId)

    const { rpID, origin } = getRpInfo(req)

    const options = await generateRegistrationOptions({
      rpName: 'Deckademics DJ School',
      rpID,
      userName: userEmail || userId,
      userID: new TextEncoder().encode(userId),
      attestationType: 'none',
      excludeCredentials: (existing || []).map((c: any) => ({
        id: c.credential_id,
        transports: c.transports || undefined,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
    })

    // Store challenge
    await admin.from('passkey_challenges').insert({
      user_id: userId,
      email: userEmail,
      challenge: options.challenge,
      type: 'registration',
    })

    return new Response(JSON.stringify({ options, rpID, origin }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('passkey-register-options error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
