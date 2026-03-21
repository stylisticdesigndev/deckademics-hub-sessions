import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  phone_number: string;
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  sms_notifications: false,
  phone_number: '',
};

export const useNotificationPreferences = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchPreferences = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('email_notifications, sms_notifications, phone_number')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
      } else if (data) {
        setPreferences({
          email_notifications: data.email_notifications,
          sms_notifications: data.sms_notifications,
          phone_number: data.phone_number || '',
        });
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [userId]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!userId) return;

    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        email_notifications: newPrefs.email_notifications,
        sms_notifications: newPrefs.sms_notifications,
        phone_number: newPrefs.phone_number || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
    }
  }, [userId, preferences, toast]);

  return { preferences, loading, updatePreferences };
};
