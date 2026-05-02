import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { isPasskeySupported, registerPasskey } from '@/lib/passkeys';

export interface UserPasskey {
  id: string;
  credential_id: string;
  device_label: string | null;
  created_at: string;
  last_used_at: string | null;
}

export function usePasskeySupport() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    isPasskeySupported().then((s) => {
      if (!cancelled) setSupported(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return supported;
}

export function useUserPasskeys() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  return useQuery({
    queryKey: ['user-passkeys', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserPasskey[]> => {
      const { data, error } = await supabase
        .from('user_passkeys')
        .select('id, credential_id, device_label, created_at, last_used_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as UserPasskey[]) || [];
    },
  });
}

export function useRegisterPasskey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => registerPasskey(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-passkeys'] });
    },
  });
}

export function useDeletePasskey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (passkeyId: string) => {
      const { error } = await supabase.from('user_passkeys').delete().eq('id', passkeyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-passkeys'] });
    },
  });
}

export function useDismissPasskeyPrompt() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from('profiles')
        .update({ passkey_prompt_dismissed: true } as any)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
