/**
 * Admin Feature Requests — view and manage feature requests submitted by students/instructors.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Clock, Rocket, XCircle, CalendarClock, Hammer, Copy, Monitor, Smartphone, Tablet, ImageIcon } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

interface FeatureRequest {
  id: string;
  requester_id: string;
  requester_role: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  device_type: string | null;
  screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', icon: <Lightbulb className="h-3 w-3" />, variant: 'default' },
  planned: { label: 'Planned', icon: <CalendarClock className="h-3 w-3" />, variant: 'secondary' },
  in_progress: { label: 'In Progress', icon: <Hammer className="h-3 w-3" />, variant: 'default' },
  shipped: { label: 'Shipped', icon: <Rocket className="h-3 w-3" />, variant: 'secondary' },
  declined: { label: 'Declined', icon: <XCircle className="h-3 w-3" />, variant: 'outline' },
};

const getDeviceIcon = (deviceType: string | null) => {
  if (!deviceType) return null;
  if (deviceType.toLowerCase().includes('ipad') || deviceType.toLowerCase().includes('tablet'))
    return <Tablet className="h-3 w-3" />;
  if (deviceType.toLowerCase().includes('phone') || deviceType.toLowerCase().includes('iphone') || deviceType.toLowerCase().includes('android'))
    return <Smartphone className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
};

const formatTimestamp = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const ACTIVE_STATUSES = ['open', 'planned', 'in_progress'];
const ARCHIVED_STATUSES = ['shipped', 'declined'];

const AdminFeatureRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [archivedFilter, setArchivedFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-feature-requests'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('feature_requests' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FeatureRequest[];
    },
  });

  const requesterIds = [...new Set(requests.map(r => r.requester_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['feature-requester-profiles', requesterIds],
    queryFn: async () => {
      if (requesterIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', requesterIds);
      return data || [];
    },
    enabled: requesterIds.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status?: string; admin_notes?: string }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;
      const { error } = await (supabase.from('feature_requests' as any) as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-open-feature-count'] });
      toast({ title: 'Feature request updated' });
      setEditingId(null);
    },
    onError: () => {
      toast({ title: 'Error updating request', variant: 'destructive' });
    },
  });

  const getRequesterName = (requesterId: string) => {
    const profile = profiles.find((p: any) => p.id === requesterId);
    if (!profile) return 'Unknown';
    return `${(profile as any).first_name || ''} ${(profile as any).last_name || ''}`.trim() || (profile as any).email;
  };

  const handleCopy = (req: FeatureRequest) => {
    let text = `${req.title}\n\n${req.description}`;
    if (req.device_type) text += `\n\nDevice: ${req.device_type}`;
    navigator.clipboard.writeText(text);
    sonnerToast.success('Feature request copied to clipboard');
  };

  const activeRequests = requests.filter(r => ACTIVE_STATUSES.includes(r.status));
  const archivedRequests = requests.filter(r => ARCHIVED_STATUSES.includes(r.status));

  const filteredActive = activeFilter === 'all' ? activeRequests : activeRequests.filter(r => r.status === activeFilter);
  const filteredArchived = archivedFilter === 'all' ? archivedRequests : archivedRequests.filter(r => r.status === archivedFilter);

  const renderCard = (req: FeatureRequest, isArchived: boolean) => {
    const config = statusConfig[req.status] || statusConfig.open;
    return (
      <Card key={req.id}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-base">{req.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                <span>{getRequesterName(req.requester_id)}</span>
                <span>•</span>
                <span className="capitalize">{req.requester_role}</span>
                <span>•</span>
                <span>{formatTimestamp(req.created_at)}</span>
                {isArchived && (
                  <>
                    <span>•</span>
                    <span className="text-xs">
                      {config.label}: {formatTimestamp(req.updated_at)}
                    </span>
                  </>
                )}
                {req.device_type && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {getDeviceIcon(req.device_type)}
                      {req.device_type}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config.variant} className="flex items-center gap-1">
                {config.icon}
                {config.label}
              </Badge>
              <Select
                value={req.status}
                onValueChange={(status) => updateMutation.mutate({ id: req.id, status })}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{req.description}</p>

          {req.screenshot_url && (
            <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-block">
              <div className="relative group">
                <img
                  src={req.screenshot_url}
                  alt="Feature mockup"
                  className="max-h-40 rounded-md border hover:opacity-80 transition-opacity cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="h-6 w-6 text-foreground bg-background/80 rounded-full p-1" />
                </div>
              </div>
            </a>
          )}

          {editingId === req.id ? (
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
                  onClick={() => updateMutation.mutate({ id: req.id, admin_notes: adminNotes })}
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
                {req.admin_notes ? (
                  <p className="text-sm text-muted-foreground italic">Admin: {req.admin_notes}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => handleCopy(req)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditingId(req.id); setAdminNotes(req.admin_notes || ''); }}
                >
                  {req.admin_notes ? 'Edit Notes' : 'Add Notes'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (message: string) => (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6" />
          Feature Requests
        </h1>
        <p className="text-muted-foreground mt-1">Review feature ideas submitted by students and instructors during beta.</p>
      </section>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Active{activeRequests.length > 0 && ` (${activeRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived{archivedRequests.length > 0 && ` (${archivedRequests.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="flex justify-end">
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredActive.length === 0
              ? renderEmptyState(activeFilter === 'all' ? 'No active feature requests.' : `No ${activeFilter.replace('_', ' ')} requests.`)
              : filteredActive.map(r => renderCard(r, false))
            }
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            <div className="flex justify-end">
              <Select value={archivedFilter} onValueChange={setArchivedFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Archived</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredArchived.length === 0
              ? renderEmptyState(archivedFilter === 'all' ? 'No archived feature requests.' : `No ${archivedFilter} requests.`)
              : filteredArchived.map(r => renderCard(r, true))
            }
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminFeatureRequests;
