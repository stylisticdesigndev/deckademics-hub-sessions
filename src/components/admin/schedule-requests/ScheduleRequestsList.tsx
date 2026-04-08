import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2, Clock } from 'lucide-react';
import { useScheduleChangeRequests, ScheduleChangeRequest } from '@/hooks/useScheduleChangeRequests';
import { format } from 'date-fns';

const ScheduleRequestsList = () => {
  const { requests, pendingRequests, isLoading, approveRequest, declineRequest } = useScheduleChangeRequests('admin');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading schedule requests...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Schedule Change Requests
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingRequests.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Review and approve instructor-submitted schedule changes.</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No schedule change requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{req.student_name}</p>
                    <p className="text-xs text-muted-foreground">Requested by {req.requester_name}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p>{req.prev_day || '—'} / {req.prev_time || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requested</p>
                    <p className="font-medium">{req.new_day} / {req.new_time}</p>
                  </div>
                </div>

                {req.reason && (
                  <p className="text-xs text-muted-foreground italic">"{req.reason}"</p>
                )}

                <p className="text-xs text-muted-foreground">
                  {format(new Date(req.created_at), 'MMM d, yyyy h:mm a')}
                </p>

                {req.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => approveRequest.mutate(req)}
                      disabled={approveRequest.isPending || declineRequest.isPending}
                    >
                      {approveRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => declineRequest.mutate(req.id)}
                      disabled={approveRequest.isPending || declineRequest.isPending}
                    >
                      {declineRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <X className="h-3 w-3 mr-1" />}
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-green-500/10 text-green-500"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
    case 'declined':
      return <Badge variant="outline" className="bg-destructive/10 text-destructive"><X className="h-3 w-3 mr-1" />Declined</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default ScheduleRequestsList;
