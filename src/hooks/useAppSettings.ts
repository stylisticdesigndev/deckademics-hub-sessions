
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AppSettings {
  id: string;
  school_name: string;
  notifications_enabled: boolean;
  notification_channels: 'email' | 'push' | 'all' | 'none';
  updated_at: string;
  updated_by: string | null;
}

interface UpdateSettingsInput {
  school_name?: string;
  notifications_enabled?: boolean;
  notification_channels?: 'email' | 'push' | 'all' | 'none';
}

export const useAppSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return data as unknown as AppSettings;
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: UpdateSettingsInput) => {
      const { data, error } = await supabase
        .from('app_settings')
        .update({
          ...newSettings,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        } as any)
        .eq('id', settings?.id as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been saved successfully.'
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Could not update settings. Please try again.',
        variant: 'destructive'
      });
    }
  });

  return {
    settings,
    isLoading,
    updateSettings
  };
};
