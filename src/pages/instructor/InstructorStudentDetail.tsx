import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, User, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface DetailData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  pronouns: string | null;
  bio: string | null;
  level: string;
  enrollment_status: string;
  class_day: string | null;
  class_time: string | null;
  start_date: string | null;
  two_way_messaging: boolean;
}

const InstructorStudentDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!studentId) return;
      setLoading(true);
      const { data: row, error: fetchError } = await supabase
        .from('students')
        .select(`
          id, level, enrollment_status, class_day, class_time, start_date, two_way_messaging,
          profiles!inner(first_name, last_name, email, avatar_url, phone, pronouns, bio)
        `)
        .eq('id', studentId)
        .maybeSingle() as any;

      if (cancelled) return;
      if (fetchError || !row) {
        setError('Could not load student.');
      } else {
        const p = row.profiles;
        setData({
          id: row.id,
          first_name: p?.first_name,
          last_name: p?.last_name,
          email: p?.email,
          avatar_url: p?.avatar_url,
          phone: p?.phone,
          pronouns: p?.pronouns,
          bio: p?.bio,
          level: row.level,
          enrollment_status: row.enrollment_status,
          class_day: row.class_day,
          class_time: row.class_time,
          start_date: row.start_date,
          two_way_messaging: row.two_way_messaging ?? true,
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">{error || 'Student not found.'}</p>
      </div>
    );
  }

  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unnamed Student';
  const initials = ((data.first_name?.[0] || '') + (data.last_name?.[0] || '')).toUpperCase() || 'S';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            {data.avatar_url && <AvatarImage src={data.avatar_url} alt={fullName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{fullName}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {data.pronouns && <span>{data.pronouns}</span>}
              <Badge variant="outline" className="capitalize">{data.level}</Badge>
              <Badge variant="outline" className="capitalize">{data.enrollment_status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{data.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{data.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{data.pronouns || 'No pronouns set'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{data.class_day || 'No class day'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{data.class_time || 'No class time'}</span>
            </div>
          </div>

          {data.bio && (
            <div>
              <p className="text-sm font-medium mb-1">Bio</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.bio}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => navigate('/instructor/students')} variant="outline">
              View All Students
            </Button>
            <Button onClick={() => navigate('/instructor/messages')}>
              Send Message
            </Button>
            <Button onClick={() => navigate('/instructor/attendance')} variant="outline">
              Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorStudentDetail;