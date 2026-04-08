/**
 * useScheduleChangeRequests — Shared hook for schedule change request management.
 *
 * Used by both instructors (to create requests) and admins (to approve/decline).
 * On approval the student's class_day and class_time are updated automatically.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

export interface ScheduleChangeRequest {
  id: string;
  student_id: string;
  requested_by: string;
  prev_day: string | null;
  prev_time: string | null;
  new_day: string;
  new_time: string;
  reason: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Joined data
  student_name?: string;
  requester_name?: string;
}

export const useScheduleChangeRequests = (role: 'admin' | 'instructor') => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['schedule-change-requests', role, userId],
    queryFn: async (): Promise<ScheduleChangeRequest[]> => {
      const { data, error } = await supabase
        .from('schedule_change_requests' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching schedule requests:', error);
        return [];
      }

      if (!data) return [];

      // Fetch student and requester names
      const studentIds = [...new Set((data as any[]).map((r: any) => r.student_id))];
      const requesterIds = [...new Set((data as any[]).map((r: any) => r.requested_by))];
      const allIds = [...new Set([...studentIds, ...requesterIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', allIds);

      const profileMap = new Map<string, string>();
      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim());
        }
      }

      return (data as any[]).map((r: any) => ({
        ...r,
        student_name: profileMap.get(r.student_id) || 'Unknown',
        requester_name: profileMap.get(r.requested_by) || 'Unknown',
      }));
    },
    enabled: !!userId,
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const createRequest = useMutation({
    mutationFn: async (params: {
      student_id: string;
      prev_day: string | null;
      prev_time: string | null;
      new_day: string;
      new_time: string;
      reason: string;
    }) => {
      const { error } = await supabase
        .from('schedule_change_requests' as any)
        .insert({
          student_id: params.student_id,
          requested_by: userId,
          prev_day: params.prev_day,
          prev_time: params.prev_time,
          new_day: params.new_day,
          new_time: params.new_time,
          reason: params.reason || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-change-requests'] });
      toast.success('Schedule change request submitted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  const approveRequest = useMutation({
    mutationFn: async (request: ScheduleChangeRequest) => {
      // Update the student's schedule
      const { error: updateError } = await supabase
        .from('students')
        .update({
          class_day: request.new_day,
          class_time: request.new_time,
        } as any)
        .eq('id', request.student_id as any);
      if (updateError) throw updateError;

      // Mark request as approved
      const { error } = await supabase
        .from('schedule_change_requests' as any)
        .update({
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        } as any)
        .eq('id', request.id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Schedule change approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const declineRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('schedule_change_requests' as any)
        .update({
          status: 'declined',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        } as any)
        .eq('id', requestId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-change-requests'] });
      toast.success('Schedule change declined');
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline: ${error.message}`);
    },
  });

  return {
    requests,
    pendingRequests,
    isLoading,
    createRequest,
    approveRequest,
    declineRequest,
  };
};
