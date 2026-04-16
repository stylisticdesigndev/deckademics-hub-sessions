/**
 * Admin Bug Reports — view and manage bug reports submitted by students/instructors.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Bug, Clock, CheckCircle2, XCircle, AlertCircle, Copy } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { capitalizeLevel } from '@/lib/utils';

interface BugReport {
  id: string;
  reporter_id: string;
  reporter_role: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', icon: <AlertCircle className="h-3 w-3" />, variant: 'destructive' },
  in_progress: { label: 'In Progress', icon: <Clock className="h-3 w-3" />, variant: 'default' },
  resolved: { label: 'Resolved', icon: <CheckCircle2 className="h-3 w-3" />, variant: 'secondary' },
  closed: { label: 'Closed', icon: <XCircle className="h-3 w-3" />, variant: 'outline' },
};

const AdminBugReports = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-bug-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bug_reports' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BugReport[];
    },
  });




  // Fetch reporter profiles
  const reporterIds = [...new Set(reports.map(r => r.reporter_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['bug-reporter-profiles', reporterIds],
    queryFn: async () => {
      if (reporterIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', reporterIds);
      return data || [];
    },
    enabled: reporterIds.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status?: string; admin_notes?: string }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;
      const { error } = await supabase.from('bug_reports' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-open-bug-count'] });
      toast({ title: 'Bug report updated' });
      setEditingId(null);
    },
    onError: () => {
      toast({ title: 'Error updating report', variant: 'destructive' });
    },
  });

  const getReporterName = (reporterId: string) => {
    const profile = profiles.find((p: any) => p.id === reporterId);
    if (!profile) return 'Unknown';
    return `${(profile as any).first_name || ''} ${(profile as any).last_name || ''}`.trim() || (profile as any).email;
  };

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Bug Reports
          </h1>
          <p className="text-muted-foreground mt-1">Review and manage bug reports from students and instructors</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {filter === 'all' ? 'No bug reports have been submitted yet.' : `No ${filter.replace('_', ' ')} reports.`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => {
            const config = statusConfig[report.status] || statusConfig.open;
            return (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{getReporterName(report.reporter_id)}</span>
                        <span>•</span>
                        <span className="capitalize">{report.reporter_role}</span>
                        <span>•</span>
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} className="flex items-center gap-1">
                        {config.icon}
                        {config.label}
                      </Badge>
                      <Select
                        value={report.status}
                        onValueChange={(status) => updateMutation.mutate({ id: report.id, status })}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{report.description}</p>
                  
                  {editingId === report.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add admin notes..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: report.id, admin_notes: adminNotes })}
                          disabled={updateMutation.isPending}
                        >
                          Save Notes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {report.admin_notes ? (
                          <p className="text-sm text-muted-foreground italic">Admin: {report.admin_notes}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const text = `${report.title}\n\n${report.description}`;
                            navigator.clipboard.writeText(text);
                            sonnerToast.success('Bug report copied to clipboard');
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingId(report.id); setAdminNotes(report.admin_notes || ''); }}
                        >
                          {report.admin_notes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBugReports;
