import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Phone } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const NotificationPreferencesCard = () => {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Choose how you want to receive updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="email-notifications" className="text-sm font-medium">
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive announcements and updates via email
              </p>
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.email_notifications}
            onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="sms-notifications" className="text-sm font-medium">
                  SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive important alerts via text message
                </p>
              </div>
            </div>
            <Switch
              id="sms-notifications"
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => updatePreferences({ sms_notifications: checked })}
            />
          </div>

          {preferences.sms_notifications && (
            <div className="ml-7 space-y-2">
              <Label htmlFor="phone-number" className="text-xs">
                Phone Number
              </Label>
              <Input
                id="phone-number"
                placeholder="(555) 123-4567"
                value={preferences.phone_number}
                onChange={(e) => updatePreferences({ phone_number: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;
