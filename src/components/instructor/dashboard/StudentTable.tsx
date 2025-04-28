
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/progress/ProgressBar';
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Student</TableHead>
                <TableHead className="w-[30%]">Progress</TableHead>
                <TableHead className="w-[15%] text-center">Level</TableHead>
                <TableHead className="w-[15%] text-center">Notes</TableHead>
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
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProgressBar 
                          value={student.progress} 
                          max={100} 
                        />
                        <span className="text-xs">{student.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{student.level}</TableCell>
                    <TableCell className="text-center">
                      {student.hasNotes ? (
                        <span className="h-2 w-2 rounded-full bg-green-500 inline-block"/>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-gray-300 inline-block"/>
                      )}
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
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-6 p-3 font-medium border-b text-xs sm:text-sm">
              <div className="col-span-3">STUDENT</div>
              <div className="col-span-1">PROGRESS</div>
              <div className="col-span-1 text-center">LEVEL</div>
              <div className="col-span-1 text-center">NOTES</div>
            </div>
            
            <div className="p-6 text-center text-muted-foreground">
              No students assigned to you yet.
            </div>
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
