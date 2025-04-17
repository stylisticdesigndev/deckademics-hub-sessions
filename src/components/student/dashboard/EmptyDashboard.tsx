
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BookOpenText, Calendar, MessageSquare, User, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const EmptyDashboard = () => {
  return (
    <div className="space-y-6">
      <Alert className="bg-deckademics-primary/10 border-deckademics-primary/20">
        <BookOpenText className="h-4 w-4 text-deckademics-primary" />
        <AlertTitle>Welcome to Deckademics DJ School!</AlertTitle>
        <AlertDescription>
          Your journey starts here. Complete the following steps to get started with your DJ education.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-deckademics-primary/30">
          <CardHeader className="bg-deckademics-primary/5">
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-deckademics-primary" /> 
              <span>Step 1: Complete Your Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">Add your personal information, contact details, and DJ interests to personalize your learning experience.</p>
            <Button asChild variant="outline" className="w-full border-deckademics-primary text-deckademics-primary hover:bg-deckademics-primary hover:text-white">
              <Link to="/student/profile">Update Profile</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" /> Step 2: Browse Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">Explore upcoming DJ classes and workshops that match your schedule and interests.</p>
            <Button asChild>
              <Link to="/student/classes">View Class Schedule</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" /> Step 3: Review Curriculum
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">Familiarize yourself with the DJ curriculum and learning path from beginner to advanced levels.</p>
            <Button asChild>
              <Link to="/student/progress">View Curriculum</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" /> Step 4: Connect With Instructors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">Introduce yourself and ask any questions you may have about your DJ journey.</p>
            <Button asChild>
              <Link to="/student/messages">Send Message</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">
              After completing your profile and enrolling in classes, you'll see your personalized dashboard with course 
              materials, upcoming sessions, and instructor announcements. Our team is excited to help you develop your DJ skills!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline">
                <a href="https://deckademics.com/faq" target="_blank" rel="noopener noreferrer">
                  Frequently Asked Questions
                </a>
              </Button>
              <Button asChild>
                <Link to="/student/messages">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
