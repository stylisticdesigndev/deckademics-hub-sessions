
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Check, X, Eye } from 'lucide-react';

const AdminInstructors = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [addInstructorOpen, setAddInstructorOpen] = useState(false);
  const [viewInstructorId, setViewInstructorId] = useState<number | null>(null);
  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
    specialization: '',
  });
  
  // Mock instructor data
  const activeInstructors = [
    { id: 1, name: 'Professor Smith', email: 'smith@example.com', students: 12, classes: 3, status: 'active', specialization: 'Turntablism' },
    { id: 2, name: 'DJ Mike', email: 'mike@example.com', students: 8, classes: 2, status: 'active', specialization: 'Scratching' },
    { id: 3, name: 'Sarah Jones', email: 'sarah@example.com', students: 15, classes: 4, status: 'active', specialization: 'Beat Mixing' },
    { id: 4, name: 'Robert Williams', email: 'robert@example.com', students: 10, classes: 2, status: 'active', specialization: 'Production' },
    { id: 5, name: 'Laura Thompson', email: 'laura@example.com', students: 7, classes: 1, status: 'active', specialization: 'Music Theory' },
  ];

  const pendingInstructors = [
    { id: 6, name: 'David Carter', email: 'david@example.com', students: 0, classes: 0, status: 'pending', specialization: 'Beat Making' },
    { id: 7, name: 'Emily Wilson', email: 'emily@example.com', students: 0, classes: 0, status: 'pending', specialization: 'Digital DJing' },
  ];

  const handleApprove = (id: number) => {
    toast({
      title: 'Instructor Approved',
      description: 'The instructor account has been approved.',
    });
  };

  const handleDecline = (id: number) => {
    toast({
      title: 'Instructor Declined',
      description: 'The instructor account has been declined.',
    });
  };

  const handleDeactivate = (id: number) => {
    toast({
      title: 'Instructor Deactivated',
      description: 'The instructor account has been deactivated.',
    });
  };

  const handleAddInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newInstructor.name || !newInstructor.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    // Here you would normally send this to your API
    toast({
      title: 'Instructor Added',
      description: `${newInstructor.name} has been added as an instructor.`,
    });
    
    // Reset form and close dialog
    setNewInstructor({ name: '', email: '', specialization: '' });
    setAddInstructorOpen(false);
  };

  const viewInstructor = (id: number) => {
    setViewInstructorId(id);
  };

  const closeViewInstructor = () => {
    setViewInstructorId(null);
  };

  const getInstructorById = (id: number) => {
    return [...activeInstructors, ...pendingInstructors].find(instructor => instructor.id === id);
  };

  const currentViewedInstructor = viewInstructorId ? getInstructorById(viewInstructorId) : null;

  const filteredActiveInstructors = activeInstructors.filter(
    instructor => instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingInstructors = pendingInstructors.filter(
    instructor => instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      sidebarContent={<AdminNavigation />}
      userType="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instructors Management</h1>
            <p className="text-muted-foreground">
              Manage all instructors, approve new requests, and assign students.
            </p>
          </div>
          
          <Dialog open={addInstructorOpen} onOpenChange={setAddInstructorOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Instructor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddInstructor}>
                <DialogHeader>
                  <DialogTitle>Add New Instructor</DialogTitle>
                  <DialogDescription>
                    Create a new instructor account. The instructor will receive an email to set up their password.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-left">Name</Label>
                    <Input
                      id="name"
                      value={newInstructor.name}
                      onChange={(e) => setNewInstructor({...newInstructor, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-left">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newInstructor.email}
                      onChange={(e) => setNewInstructor({...newInstructor, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="specialization" className="text-left">Specialization</Label>
                    <Input
                      id="specialization"
                      value={newInstructor.specialization}
                      onChange={(e) => setNewInstructor({...newInstructor, specialization: e.target.value})}
                      placeholder="E.g., Turntablism, Scratching, Beat Mixing"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddInstructorOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Instructor</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search instructors..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Active Instructors ({filteredActiveInstructors.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Approval ({filteredPendingInstructors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Instructors</CardTitle>
                <CardDescription>
                  Manage your current instructor team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-center font-medium">Students</th>
                        <th className="px-4 py-3 text-center font-medium">Classes</th>
                        <th className="px-4 py-3 text-center font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActiveInstructors.map((instructor) => (
                        <tr key={instructor.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{instructor.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{instructor.email}</td>
                          <td className="px-4 py-3 text-center">{instructor.students}</td>
                          <td className="px-4 py-3 text-center">{instructor.classes}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500">
                              Active
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewInstructor(instructor.id)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeactivate(instructor.id)}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Deactivate
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredActiveInstructors.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                            No instructors found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Instructors</CardTitle>
                <CardDescription>
                  Review and approve instructor account requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-center font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingInstructors.map((instructor) => (
                        <tr key={instructor.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{instructor.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{instructor.email}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500">
                              Pending
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewInstructor(instructor.id)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleApprove(instructor.id)}
                                className="bg-green-500 text-white hover:bg-green-600"
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDecline(instructor.id)}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Decline
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPendingInstructors.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            No pending instructors found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Instructor View Sheet */}
      <Sheet open={viewInstructorId !== null} onOpenChange={closeViewInstructor}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Instructor Details</SheetTitle>
            <SheetDescription>
              View instructor information and statistics
            </SheetDescription>
          </SheetHeader>
          {currentViewedInstructor && (
            <div className="space-y-6 py-6">
              <div className="flex flex-col space-y-4">
                <div className="h-24 w-24 rounded-full bg-deckademics-primary/20 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-deckademics-primary">
                    {currentViewedInstructor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <div className="space-y-1 text-center">
                  <h3 className="text-xl font-bold">{currentViewedInstructor.name}</h3>
                  <p className="text-muted-foreground">{currentViewedInstructor.email}</p>
                  <Badge 
                    variant="outline" 
                    className={currentViewedInstructor.status === 'active' 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-amber-500/10 text-amber-500"}
                  >
                    {currentViewedInstructor.status === 'active' ? 'Active' : 'Pending'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium mb-2">Specialization</h4>
                  <p>{currentViewedInstructor.specialization || 'Not specified'}</p>
                </div>
                
                {currentViewedInstructor.status === 'active' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-3">
                        <div className="text-2xl font-bold">{currentViewedInstructor.students}</div>
                        <div className="text-sm text-muted-foreground">Students</div>
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="text-2xl font-bold">{currentViewedInstructor.classes}</div>
                        <div className="text-sm text-muted-foreground">Classes</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="border-t pt-4 flex justify-end">
                <Button onClick={closeViewInstructor}>Close</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default AdminInstructors;
