
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  name: string;
  progress: number;
  level: string;
  hasNotes: boolean;
  avatar?: string;
  initials: string;
  classTime?: string;
}

interface StudentTableProps {
  students: Student[];
}

export const StudentTable: React.FC<StudentTableProps> = ({ students }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center pb-4">
        <CardTitle>Today's Students</CardTitle>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search students..."
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={students.length === 0}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Student</TableHead>
                    <TableHead className="w-[25%]">Progress</TableHead>
                    <TableHead className="w-[15%] text-center">Level</TableHead>
                    <TableHead className="w-[30%] text-center whitespace-nowrap">Class Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <TableRow 
                        key={student.id}
                        className="cursor-pointer hover:bg-muted/60"
                        onClick={() => navigate(`/instructor/students/${student.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {student.avatar && <AvatarImage src={student.avatar} alt={student.name} />}
                              <AvatarFallback className="text-xs">
                                {student.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProgressBar 
                              value={student.progress} 
                              max={100}
                              showPercentage={false}
                            />
                            <span className="text-xs">{student.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center capitalize">{student.level}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground whitespace-nowrap">
                          {student.classTime ? student.classTime.replace(/ - /g, '\u00A0-\u00A0') : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No students match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <div
                    key={student.id}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-muted/60"
                    onClick={() => navigate(`/instructor/students/${student.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {student.avatar && <AvatarImage src={student.avatar} alt={student.name} />}
                          <AvatarFallback className="text-xs">
                            {student.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{student.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{student.level}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {student.classTime || '—'}
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={student.progress} max={100} showPercentage={false} size="sm" />
                      <span className="text-xs">{student.progress}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No students match your search.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            No students scheduled for today.
          </div>
        )}
        
        <div className="mt-4 text-right">
          <Button onClick={() => navigate('/instructor/students')}>
            View All Students
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
