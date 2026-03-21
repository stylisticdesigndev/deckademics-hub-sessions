
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User, BookOpen, GraduationCap, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import NotificationPreferencesCard from '@/components/student/profile/NotificationPreferencesCard';
import { mockProfileData } from '@/data/mockDashboardData';

const StudentProfile = () => {
  const { toast } = useToast();
  const { userData, updateProfile, session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [instructorData, setInstructorData] = useState<any>(null);
  
  const isDemoActive = !session || demoMode;

  const fullName = userData?.profile 
    ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim()
    : session?.user?.user_metadata 
      ? `${session.user.user_metadata.first_name || ''} ${session.user.user_metadata.last_name || ''}`.trim()
      : '';
      
  const [profile, setProfile] = useState({
    name: fullName || '',
    email: userData?.profile?.email || session?.user?.email || '',
    phone: userData?.profile?.phone || '',
    bio: userData?.profile?.bio || '',
  });

  const [formData, setFormData] = useState({...profile});
  
  const studentId = session?.user?.id;

  // Resolve display data based on demo mode
  const displayProfile = isDemoActive ? {
    name: mockProfileData.name,
    email: mockProfileData.email,
    phone: mockProfileData.phone,
    bio: mockProfileData.bio,
  } : profile;

  const displayFormData = isDemoActive ? {
    name: mockProfileData.name,
    email: mockProfileData.email,
    phone: mockProfileData.phone,
    bio: mockProfileData.bio,
  } : formData;

  const displayCourse = isDemoActive ? mockProfileData.course : courseData;
  const displayInstructor = isDemoActive ? mockProfileData.instructor : instructorData;
  const displayLevel = isDemoActive ? mockProfileData.course.level : (courseData?.level || studentData?.level || 'Beginner');
  
  useEffect(() => {
    if (isDemoActive) {
      setLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
          
        if (studentError && studentError.code !== 'PGRST116') {
          console.error('Error fetching student data:', studentError);
        } else {
          setStudentData(student);
        }
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('bio')
          .eq('id', studentId)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile data:', profileError);
        }
        
        const bioText = profileData?.bio || '';
        setProfile(prev => ({ ...prev, bio: bioText }));
        setFormData(prev => ({ ...prev, bio: bioText }));
        
        if (student) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('class_id')
            .eq('student_id', studentId)
            .limit(1);
            
          if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError);
          } else if (enrollments && enrollments.length > 0) {
            const { data: classData, error: classError } = await supabase
              .from('classes')
              .select('id, title, course_id, instructor_id')
              .eq('id', enrollments[0].class_id)
              .single();
              
            if (classError) {
              console.error('Error fetching class data:', classError);
            } else if (classData) {
              if (classData.course_id) {
                const { data: course, error: courseError } = await supabase
                  .from('courses')
                  .select('*')
                  .eq('id', classData.course_id)
                  .single();
                if (!courseError) setCourseData(course);
              }
              if (classData.instructor_id) {
                const { data: instructor, error: instructorError } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('id', classData.instructor_id)
                  .single();
                if (!instructorError) setInstructorData(instructor);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchStudentData:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [studentId, isDemoActive]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone,
        bio: formData.bio
      });
      
      setProfile({...formData});
      setIsEditing(false);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const initials = displayProfile.name 
    ? displayProfile.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : '?';

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your personal information
            </p>
          </div>
          {session && (
            <Button
              variant={demoMode ? "default" : "outline"}
              size="sm"
              onClick={() => setDemoMode(!demoMode)}
            >
              {demoMode ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {demoMode ? 'Live Data' : 'Demo'}
            </Button>
          )}
        </section>

        {isDemoActive && (
          <Alert variant="default" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Demo Mode</AlertTitle>
            <AlertDescription className="text-destructive/80">
              Viewing sample profile data. {session ? 'Toggle off to see your real profile.' : 'Log in to see your real profile.'}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Row 1: Profile Header */}
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">{displayProfile.name || 'Student'}</h2>
                  <p className="text-sm text-muted-foreground truncate">{displayProfile.email}</p>
                </div>
                {!isEditing && !isDemoActive && (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Row 2: Personal Details + Enrollment Details */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Personal Details */}
              <form onSubmit={handleSubmit}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Details</CardTitle>
                    <CardDescription>Your contact and bio information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input id="name" name="name" placeholder="Your name" className="pl-10" value={displayFormData.name} onChange={handleChange} disabled={!isEditing || isDemoActive} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input id="email" name="email" type="email" placeholder="Your email" className="pl-10" value={displayFormData.email} onChange={handleChange} disabled={true} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input id="phone" name="phone" placeholder="Your phone number" className="pl-10" value={displayFormData.phone} onChange={handleChange} disabled={!isEditing || isDemoActive} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" placeholder="Tell us about yourself and your DJ interests" rows={3} value={displayFormData.bio} onChange={handleChange} disabled={!isEditing || isDemoActive} />
                    </div>
                  </CardContent>
                  {isEditing && !isDemoActive && (
                    <CardFooter className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({...profile}); }}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </form>

              {/* Enrollment Details */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Enrollment Details</CardTitle>
                  <CardDescription>Your course and instructor information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  {/* Course Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Course</span>
                    </div>
                    {displayCourse ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Level</p>
                          <p className="text-sm font-medium capitalize">{displayLevel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm font-medium">{displayCourse.duration_weeks || 12} weeks</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        Course details will appear once you're enrolled.
                      </p>
                    )}
                  </div>

                  <hr className="border-border" />

                  {/* Instructor Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>Instructor</span>
                    </div>
                    {displayInstructor ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                            {`${displayInstructor.first_name?.[0] || ''}${displayInstructor.last_name?.[0] || ''}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{`${displayInstructor.first_name || ''} ${displayInstructor.last_name || ''}`.trim()}</p>
                          <p className="text-xs text-muted-foreground">DJ Instructor</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        Instructor info will appear once assigned.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Notification Preferences */}
            <NotificationPreferencesCard />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
