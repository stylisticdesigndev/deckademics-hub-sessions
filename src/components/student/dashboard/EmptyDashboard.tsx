
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BookOpenText, Calendar, MessageSquare, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const EmptyDashboard = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <BookOpenText className="h-4 w-4" />
        <AlertTitle>Welcome to Deckademics!</AlertTitle>
        <AlertDescription>
          Your dashboard is currently empty. Complete your profile and check back for upcoming classes and announcements.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" /> Complete Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Add your personal information and preferences to get the most out of your DJ learning experience.</p>
            <Button asChild>
              <Link to="/student/profile">Update Profile</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" /> Browse Available Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Explore and enroll in upcoming DJ classes that match your interests and schedule.</p>
            <Button asChild>
              <Link to="/student/classes">View Classes</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" /> Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Need help getting started? Have questions about your enrollment? Our support team is ready to assist you.</p>
            <Button asChild>
              <Link to="/student/messages">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
