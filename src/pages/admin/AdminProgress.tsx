import React, { useState, useMemo } from 'react';
import { useAdminProgress } from '@/hooks/useAdminProgress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Search, TrendingUp, Users, BarChart3 } from 'lucide-react';

const AdminProgress = () => {
  const { data: students = [], isLoading } = useAdminProgress();
  const [levelFilter, setLevelFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const instructors = useMemo(() => {
    const names = new Set<string>();
    students.forEach(s => { if (s.instructorName) names.add(s.instructorName); });
    return Array.from(names).sort();
  }, [students]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (levelFilter !== 'all' && s.level !== levelFilter) return false;
      if (instructorFilter !== 'all' && (s.instructorName || 'Unassigned') !== instructorFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!`${s.firstName} ${s.lastName}`.toLowerCase().includes(q) &&
            !s.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [students, levelFilter, instructorFilter, searchQuery]);

  const avgProgress = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round(filtered.reduce((sum, s) => sum + s.overallProgress, 0) / filtered.length);
  }, [filtered]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { novice: 0, amateur: 0, intermediate: 0, advanced: 0 };
    students.forEach(s => { counts[s.level] = (counts[s.level] || 0) + 1; });
    return counts;
  }, [students]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress Overview</h1>
        <p className="text-muted-foreground">
          Bird's-eye view of curriculum completion across all active students.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{avgProgress}%</p>
            <p className="text-xs text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{students.length}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        {Object.entries(levelCounts).map(([level, count]) => (
          <Card key={level}>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{level}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="novice">Novice</SelectItem>
            <SelectItem value="amateur">Amateur</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={instructorFilter} onValueChange={setInstructorFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Instructors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Instructors</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            {instructors.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Active Students</CardTitle>
          <CardDescription>
            Showing {filtered.length} of {students.length} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Overall Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{student.level}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.instructorName || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <Progress value={student.overallProgress} className="flex-1" />
                        <span className="text-sm font-medium w-10 text-right">{student.overallProgress}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No students found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProgress;
