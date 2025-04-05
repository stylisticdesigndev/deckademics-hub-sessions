
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: {
    name: string;
    role: string;
    avatar?: string;
    initials: string;
  };
  subject: string;
  content: string;
  date: string;
  read: boolean;
  requiresResponse: boolean;
  responded?: boolean;
}

const StudentMessages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: {
        name: 'DJ Rhythm',
        role: 'Instructor',
        initials: 'DR',
      },
      subject: 'Feedback on your last session',
      content: 'Hi Alex, I was impressed by your progress in the last session! Your beat matching has improved significantly. For the next class, please focus on smoother transitions between tracks.',
      date: '3 hours ago',
      read: false,
      requiresResponse: false,
    },
    {
      id: '2',
      sender: {
        name: 'Admin',
        role: 'Administration',
        initials: 'AD',
      },
      subject: 'Equipment reservation confirmed',
      content: 'Your request to reserve Studio A equipment for practice on Friday, April 10th from 4-6 PM has been approved. Please check in at the front desk 15 minutes before your session.',
      date: '1 day ago',
      read: false,
      requiresResponse: true,
    },
    {
      id: '3',
      sender: {
        name: 'DJ Scratch Master',
        role: 'Instructor',
        initials: 'SM',
      },
      subject: 'Advanced scratching workshop',
      content: 'Based on your progress, I recommend you join the advanced scratching workshop next week. It will cover techniques that align perfectly with your current skill level.',
      date: '3 days ago',
      read: true,
      requiresResponse: true,
      responded: true,
    },
    {
      id: '4',
      sender: {
        name: 'Tech Support',
        role: 'Staff',
        initials: 'TS',
      },
      subject: 'Software update available',
      content: 'We\'ve updated the DJ software in all practice rooms. Please check out the new features during your next practice session. There are new effects that might interest you!',
      date: '1 week ago',
      read: true,
      requiresResponse: false,
    },
  ]);

  const markAsRead = (id: string) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === id ? { ...message, read: true } : message
      )
    );
  };

  const respondToMessage = (id: string) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === id ? { ...message, responded: true } : message
      )
    );
    
    toast({
      title: 'Response sent',
      description: 'Your confirmation has been sent.',
    });
  };

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Messages & Updates</h1>
          <p className="text-muted-foreground mt-2">
            View messages and updates from your instructors and administrators
          </p>
        </section>

        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map(message => (
              <Card 
                key={message.id} 
                className={cn(
                  "border", 
                  !message.read && "border-l-4 border-l-deckademics-primary"
                )}
                onClick={() => markAsRead(message.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      {message.sender.avatar ? (
                        <img src={message.sender.avatar} alt={message.sender.name} />
                      ) : (
                        <AvatarFallback className={cn(
                          "text-sm",
                          message.sender.role === 'Instructor' ? "bg-deckademics-primary/20 text-deckademics-primary" :
                          message.sender.role === 'Administration' ? "bg-blue-500/20 text-blue-500" : 
                          "bg-green-500/20 text-green-500"
                        )}>
                          {message.sender.initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{message.sender.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {message.sender.role}
                        </Badge>
                        {!message.read && (
                          <Badge className="bg-deckademics-primary text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{message.subject}</p>
                      <p className="text-xs text-muted-foreground">{message.date}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm">{message.content}</p>
                </CardContent>
                {message.requiresResponse && (
                  <CardFooter className="p-4 pt-0 flex justify-end">
                    {message.responded ? (
                      <div className="flex items-center text-green-500 text-sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirmed
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          respondToMessage(message.id);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Confirm Receipt
                      </Button>
                    )}
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">No messages</h3>
            <p className="text-muted-foreground mt-2">
              You don't have any messages at the moment.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentMessages;
