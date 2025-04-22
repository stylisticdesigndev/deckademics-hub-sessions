
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const StudentProfile = () => {
  const { toast } = useToast();
  const { userData, updateProfile, session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [instructorData, setInstructorData] = useState<any>(null);
  
  // Generate name from profile or session
  const fullName = userData?.profile 
    ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim()
    : session?.user?.user_metadata 
      ? `${session.user.user_metadata.first_name || ''} ${session.user.user_metadata.last_name || ''}`.trim()
      : '';
      
  const [profile, setProfile] = useState({
    name: fullName || '',
    email: userData?.profile?.email || session?.user?.email || '',
    phone: userData?.profile?.phone || '',
    bio: '',
  });

  const [formData, setFormData] = useState({...profile});
  
  const studentId = session?.user?.id;
  
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        
        // Fetch student data
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
          
        if (studentError && studentError.code !== 'PGRST116') {
          console.error('Error fetching student data:', studentError);
        } else {
          console.log('Student data fetched:', student);
          setStudentData(student);
        }
        
        // Since bio is not directly in profiles table (according to the error), we need to handle it differently
        // We could have it stored in students table, or we can use the notes field as bio for now
        let bioText = '';
        if (student && student.notes) {
          bioText = student.notes;
        }
        
        // Update the profile state with the bio
        setProfile(prev => ({
          ...prev,
          bio: bioText || 'No bio provided yet.'
        }));
        
        setFormData(prev => ({
          ...prev,
          bio: bioText || 'No bio provided yet.'
        }));
        
        // Try to fetch course and instructor data
        if (student) {
          // Check if the student is enrolled in any classes
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('class_id')
            .eq('student_id', studentId)
            .limit(1);
            
          if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError);
          } else if (enrollments && enrollments.length > 0) {
            // Fetch class and instructor info
            const { data: classData, error: classError } = await supabase
              .from('classes')
              .select(`
                id,
                title,
                course_id,
                instructor_id
              `)
              .eq('id', enrollments[0].class_id)
              .single();
              
            if (classError) {
              console.error('Error fetching class data:', classError);
            } else if (classData) {
              // If we have a class, get the course data
              if (classData.course_id) {
                const { data: course, error: courseError } = await supabase
                  .from('courses')
                  .select('*')
                  .eq('id', classData.course_id)
                  .single();
                  
                if (courseError) {
                  console.error('Error fetching course data:', courseError);
                } else {
                  setCourseData(course);
                }
              }
              
              // If we have an instructor, get the instructor data
              if (classData.instructor_id) {
                const { data: instructor, error: instructorError } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('id', classData.instructor_id)
                  .single();
                  
                if (instructorError) {
                  console.error('Error fetching instructor data:', instructorError);
                } else {
                  setInstructorData(instructor);
                }
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
  }, [studentId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Extract first and last name from the full name
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone
      });
      
      // Update the bio/notes in the students table
      if (studentId) {
        const { error: updateError } = await supabase
          .from('students')
          .update({ notes: formData.bio })
          .eq('id', studentId);
          
        if (updateError) {
          console.error('Error updating student notes:', updateError);
          throw new Error('Failed to update bio');
        }
      }
      
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

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your personal information
          </p>
        </section>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Manage your profile information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center pb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl bg-deckademics-primary text-primary-foreground">
                          {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      {isEditing ? (
                        <Button type="button" variant="outline">
                          Upload New Photo
                        </Button>
                      ) : null}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                              id="name" 
                              name="name" 
                              placeholder="Your name" 
                              className="pl-10" 
                              value={formData.name} 
                              onChange={handleChange} 
                              disabled={!isEditing} 
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                              id="email" 
                              name="email" 
                              type="email" 
                              placeholder="Your email" 
                              className="pl-10" 
                              value={formData.email} 
                              onChange={handleChange} 
                              disabled={true} 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input 
                            id="phone" 
                            name="phone" 
                            placeholder="Your phone number" 
                            className="pl-10" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            disabled={!isEditing} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          name="bio" 
                          placeholder="Tell us about yourself and your DJ interests" 
                          rows={4} 
                          value={formData.bio} 
                          onChange={handleChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button type="button" variant="outline" onClick={() => {
                          setIsEditing(false);
                          setFormData({...profile});
                        }}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </form>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                  <CardDescription>
                    Your course details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courseData ? (
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium">Course</h3>
                        <p>{courseData.title}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Level</h3>
                        <p className="capitalize">{courseData.level || studentData?.level || 'Beginner'}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Duration</h3>
                        <p>{courseData.duration_weeks || 12} weeks</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-col py-8 text-center">
                      <p className="text-muted-foreground">
                        No course information available yet.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Course details will appear here once you're enrolled.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Instructor</CardTitle>
                  <CardDescription>
                    Your assigned instructor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {instructorData ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-deckademics-accent text-primary-foreground">
                          {`${instructorData.first_name?.[0] || ''}${instructorData.last_name?.[0] || ''}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{`${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim()}</h3>
                        <p className="text-sm text-muted-foreground">DJ Instructor</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-col py-8 text-center">
                      <p className="text-muted-foreground">
                        No instructor assigned yet.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Instructor information will appear here once assigned.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
