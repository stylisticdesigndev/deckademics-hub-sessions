
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User, BookOpen, GraduationCap, Eye, EyeOff, AlertTriangle, UserCircle2, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { supabase } from '@/integrations/supabase/client';
import NotificationPreferencesCard from '@/components/student/profile/NotificationPreferencesCard';
import { mockProfileData } from '@/data/mockDashboardData';
import { capitalizeLevel } from '@/lib/utils';
import { formatDateUS } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const StudentProfile = () => {
  const { toast } = useToast();
  const { userData, updateProfile, session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [instructorData, setInstructorData] = useState<any>(null);
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  
  const isDemoActive = !session || demoMode;

  const [profile, setProfile] = useState({
    firstName: userData?.profile?.first_name || session?.user?.user_metadata?.first_name || '',
    lastName: userData?.profile?.last_name || session?.user?.user_metadata?.last_name || '',
    email: userData?.profile?.email || session?.user?.email || '',
    phone: userData?.profile?.phone || '',
    bio: userData?.profile?.bio || '',
    pronouns: (userData?.profile as any)?.pronouns || '',
  });

  const [formData, setFormData] = useState({...profile});
  
  const studentId = session?.user?.id;

  // Resolve display data based on demo mode
  const mockNameParts = (mockProfileData.name || '').split(' ');
  const mockFirst = mockNameParts[0] || '';
  const mockLast = mockNameParts.slice(1).join(' ') || '';
  const displayProfile = isDemoActive ? {
    firstName: mockFirst, lastName: mockLast,
    email: mockProfileData.email,
    phone: mockProfileData.phone,
    bio: mockProfileData.bio,
    pronouns: '',
  } : profile;

  const displayFormData = isDemoActive ? {
    firstName: mockFirst, lastName: mockLast,
    email: mockProfileData.email,
    phone: mockProfileData.phone,
    bio: mockProfileData.bio,
    pronouns: '',
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
          .select('bio, first_name, last_name, phone, pronouns')
          .eq('id', studentId)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile data:', profileError);
        }
        
        if (profileData) {
          const merged = {
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            phone: profileData.phone || '',
            bio: profileData.bio || '',
            pronouns: (profileData as any).pronouns || '',
          };
          setProfile(prev => ({ ...prev, ...merged }));
          setFormData(prev => ({ ...prev, ...merged }));
        }
        
        if (student) {
          // Fetch instructor directly from students.instructor_id
          if (student.instructor_id) {
            const { data: instructor, error: instructorError } = await supabase
              .from('profiles')
              .select('first_name, last_name, dj_name, avatar_url, email, phone, bio, pronouns')
              .eq('id', student.instructor_id)
              .single();
            let merged: any = (!instructorError && instructor) ? instructor : null;
            const { data: instrExtra } = await supabase
              .from('instructors')
              .select('bio, specialties, years_experience, hide_phone, hide_email')
              .eq('id', student.instructor_id)
              .maybeSingle();
            if (merged && instrExtra) {
              merged = {
                ...merged,
                bio: instrExtra.bio || merged.bio,
                specialties: instrExtra.specialties || [],
                years_experience: instrExtra.years_experience,
                hide_phone: !!instrExtra.hide_phone,
                hide_email: !!instrExtra.hide_email,
              };
            }
            if (merged) setInstructorData(merged);
          }

          // Fetch course data from enrollments if available
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('class_id')
            .eq('student_id', studentId)
            .limit(1);

          if (enrollments && enrollments.length > 0) {
            const { data: classData } = await supabase
              .from('classes')
              .select('course_id')
              .eq('id', enrollments[0].class_id)
              .single();

            if (classData?.course_id) {
              const { data: course } = await supabase
                .from('courses')
                .select('*')
                .eq('id', classData.course_id)
                .single();
              if (course) setCourseData(course);
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
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        pronouns: formData.pronouns,
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

  const initialsName = `${displayProfile.firstName} ${displayProfile.lastName}`.trim();
  const initials = initialsName
    ? initialsName.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';
  const displayFullName = `${displayProfile.firstName} ${displayProfile.lastName}`.trim();

  return (
    <>
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
                {isDemoActive ? (
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <AvatarUpload
                    currentUrl={userData?.profile?.avatar_url}
                    onUpload={async (url) => {
                      try {
                        await updateProfile({ avatar_url: url });
                      } catch (e) {
                        console.error('Error updating avatar:', e);
                      }
                    }}
                    initials={initials}
                    size="md"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">{displayFullName || 'Student'}</h2>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input id="firstName" name="firstName" placeholder="First name" className="pl-10" value={displayFormData.firstName} onChange={handleChange} disabled={!isEditing || isDemoActive} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input id="lastName" name="lastName" placeholder="Last name" className="pl-10" value={displayFormData.lastName} onChange={handleChange} disabled={!isEditing || isDemoActive} />
                        </div>
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
                      <Label htmlFor="pronouns">Pronouns</Label>
                      <div className="relative">
                        <UserCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input id="pronouns" name="pronouns" placeholder="she/her, he/him, they/them..." className="pl-10" value={(displayFormData as any).pronouns || ''} onChange={handleChange} disabled={!isEditing || isDemoActive} />
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="text-sm font-medium">{capitalizeLevel(displayLevel)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Status</p>
                        <p className="text-sm font-medium capitalize">{isDemoActive ? 'Active' : (studentData?.enrollment_status || 'Pending')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Class Day</p>
                        <p className="text-sm font-medium">{isDemoActive ? 'Tuesdays' : (studentData?.class_day || 'Not assigned')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Class Time</p>
                        <p className="text-sm font-medium">{isDemoActive ? '6:00 PM' : (studentData?.class_time || 'Not assigned')}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</p>
                        <p className="text-sm font-medium">{isDemoActive ? formatDateUS(new Date().toISOString()) : (studentData?.start_date ? formatDateUS(studentData.start_date) : 'Not set')}</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Instructor Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>Instructor</span>
                    </div>
                    {displayInstructor ? (
                      <button
                        type="button"
                        onClick={() => setInstructorDialogOpen(true)}
                        className="flex items-center gap-3 w-full text-left p-2 -m-2 rounded-md hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <Avatar className="h-10 w-10">
                          {displayInstructor.avatar_url && <AvatarImage src={displayInstructor.avatar_url} alt={`${displayInstructor.first_name} ${displayInstructor.last_name}`} />}
                          <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                            {`${displayInstructor.first_name?.[0] || ''}${displayInstructor.last_name?.[0] || ''}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium hover:underline">{`${displayInstructor.first_name || ''} ${displayInstructor.last_name || ''}`.trim()}</p>
                          <p className="text-xs text-muted-foreground">DJ Instructor · View profile</p>
                        </div>
                      </button>
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

        {/* Instructor Profile Dialog */}
        <Dialog open={instructorDialogOpen} onOpenChange={setInstructorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Instructor Profile</DialogTitle>
              <DialogDescription>Details about your assigned instructor</DialogDescription>
            </DialogHeader>
            {displayInstructor && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {displayInstructor.avatar_url && <AvatarImage src={displayInstructor.avatar_url} alt={`${displayInstructor.first_name} ${displayInstructor.last_name}`} />}
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {`${displayInstructor.first_name?.[0] || ''}${displayInstructor.last_name?.[0] || ''}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold">{`${displayInstructor.first_name || ''} ${displayInstructor.last_name || ''}`.trim()}</p>
                    <p className="text-xs text-muted-foreground">DJ Instructor</p>
                    {displayInstructor.pronouns && (
                      <p className="text-xs text-muted-foreground">{displayInstructor.pronouns}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {displayInstructor.email && !displayInstructor.hide_email && (
                    <div className="flex items-start gap-2">
                      <AtSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <a href={`mailto:${displayInstructor.email}`} className="text-primary hover:underline break-all">
                        {displayInstructor.email}
                      </a>
                    </div>
                  )}
                  {displayInstructor.phone && !displayInstructor.hide_phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <a href={`tel:${displayInstructor.phone}`} className="text-primary hover:underline">
                        {displayInstructor.phone}
                      </a>
                    </div>
                  )}
                  {displayInstructor.bio && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">About</p>
                      <p className="text-sm whitespace-pre-wrap">{displayInstructor.bio}</p>
                    </div>
                  )}
                  {Array.isArray(displayInstructor.specialties) && displayInstructor.specialties.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Areas of Expertise</p>
                      <div className="flex flex-wrap gap-1.5">
                        {displayInstructor.specialties.map((s: string, i: number) => (
                          <span key={i} className="text-xs bg-accent text-accent-foreground rounded-full px-2 py-0.5">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {typeof displayInstructor.years_experience === 'number' && displayInstructor.years_experience > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Experience</p>
                      <p className="text-sm">{displayInstructor.years_experience} years</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default StudentProfile;
