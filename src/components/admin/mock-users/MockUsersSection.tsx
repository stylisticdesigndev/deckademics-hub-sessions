import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMockUsers } from '@/hooks/useMockUsers';
import { useAppSettings } from '@/hooks/useAppSettings';

const MockUsersSection = () => {
  const { settings, updateSettings } = useAppSettings();
  const { mockUsers, isLoading, setMockFlag, deleteAllMockUsers } = useMockUsers();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hideMocks = settings?.hide_mock_users === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock Users</CardTitle>
        <CardDescription>
          Manage test/seed accounts. Tag mocks during beta, hide them at launch, then permanently delete when ready.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-md border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="hide-mock-users" className="text-sm font-medium">Hide mock users</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, all mock users are hidden from Students, Instructors, and other admin lists.
            </p>
          </div>
          <Switch
            id="hide-mock-users"
            checked={hideMocks}
            disabled={updateSettings.isPending}
            onCheckedChange={(checked) => updateSettings.mutate({ hide_mock_users: checked })}
          />
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold">
                Flagged Mock Users ({mockUsers.length})
              </h4>
              <p className="text-xs text-muted-foreground">All accounts currently marked as mock.</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={mockUsers.length === 0 || deleteAllMockUsers.isPending}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Permanently Delete All
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : mockUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No mock users flagged yet. Use the toggle in any student or instructor's detail view to flag them.
            </p>
          ) : (
            <div className="rounded-md border divide-y">
              {mockUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {u.first_name || ''} {u.last_name || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">{u.role}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setMockFlag.isPending}
                    onClick={() => setMockFlag.mutate({ userIds: [u.id], isMock: false })}
                  >
                    Unmark
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently delete {mockUsers.length} mock user{mockUsers.length === 1 ? '' : 's'}?
            </DialogTitle>
            <DialogDescription>
              This will permanently remove all flagged mock users and all of their related data
              (messages, notes, attendance, payments, schedules, etc.). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteAllMockUsers.isPending}
              onClick={async () => {
                await deleteAllMockUsers.mutateAsync();
                setConfirmDelete(false);
              }}
            >
              {deleteAllMockUsers.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                'Yes, delete permanently'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MockUsersSection;