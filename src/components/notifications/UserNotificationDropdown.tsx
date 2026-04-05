import React, { useState } from 'react';
import { Bell, Check, MessageSquare, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserNotifications, UserNotification } from '@/hooks/useUserNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  message: MessageSquare,
  announcement: Megaphone,
};

interface UserNotificationDropdownProps {
  userType: 'student' | 'instructor';
}

export const UserNotificationDropdown = ({ userType }: UserNotificationDropdownProps) => {
  const { userData } = useAuth();
  const userId = userData.user?.id;
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUserNotifications(userId, userType);
  const [open, setOpen] = useState(false);
  const [optimisticUnread, setOptimisticUnread] = useState<number | null>(null);

  const displayCount = optimisticUnread !== null ? optimisticUnread : unreadCount;

  React.useEffect(() => {
    setOptimisticUnread(null);
  }, [unreadCount]);

  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.read) {
      setOptimisticUnread(Math.max(0, (optimisticUnread !== null ? optimisticUnread : unreadCount) - 1));
      markAsRead.mutate(notification);
    }
    if (notification.type === 'message') {
      navigate(`/${userType}/messages`);
    } else {
      navigate(`/${userType}/announcements`);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {displayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {displayCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                setOptimisticUnread(0);
                markAllAsRead.mutate();
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 20).map(notification => {
              const Icon = iconMap[notification.type] || Bell;
              return (
                <div
                  key={`${notification.type}-${notification.id}`}
                  className={`flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
