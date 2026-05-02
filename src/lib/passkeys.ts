/**
 * Passkeys / WebAuthn client wrapper.
 * Talks to the four passkey-* Supabase Edge Functions.
 */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    if (
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch {
    return false;
  }
}

/** Register a new passkey for the currently signed-in user. */
export async function registerPasskey(): Promise<{ deviceLabel: string }> {
  const { data: optsResp, error: optsErr } = await supabase.functions.invoke(
    'passkey-register-options',
    { body: {} },
  );
  if (optsErr) throw new Error(optsErr.message || 'Could not start registration');
  if (!optsResp?.options) throw new Error('Invalid registration options');

  const attResp = await startRegistration({ optionsJSON: optsResp.options });

  const { data: verifyResp, error: verifyErr } = await supabase.functions.invoke(
    'passkey-register-verify',
    { body: { response: attResp } },
  );
  if (verifyErr) throw new Error(verifyErr.message || 'Verification failed');
  if (!verifyResp?.verified) {
    throw new Error(verifyResp?.error || 'Passkey verification failed');
  }
  return { deviceLabel: verifyResp.deviceLabel || 'This device' };
}

/** Sign in with an existing passkey. Optionally pass an email to scope to a user. */
export async function signInWithPasskey(email?: string): Promise<void> {
  const { data: optsResp, error: optsErr } = await supabase.functions.invoke(
    'passkey-auth-options',
    { body: { email: email || undefined } },
  );
  if (optsErr) throw new Error(optsErr.message || 'Could not start sign-in');
  if (!optsResp?.options) throw new Error('Invalid authentication options');

  const assertion = await startAuthentication({ optionsJSON: optsResp.options });

  const { data: verifyResp, error: verifyErr } = await supabase.functions.invoke(
    'passkey-auth-verify',
    { body: { response: assertion } },
  );
  if (verifyErr) throw new Error(verifyErr.message || 'Sign-in failed');
  if (!verifyResp?.verified || !verifyResp?.access_token || !verifyResp?.refresh_token) {
    throw new Error(verifyResp?.error || 'Passkey sign-in failed');
  }

  const { error: setErr } = await supabase.auth.setSession({
    access_token: verifyResp.access_token,
    refresh_token: verifyResp.refresh_token,
  });
  if (setErr) throw new Error(setErr.message);
}
