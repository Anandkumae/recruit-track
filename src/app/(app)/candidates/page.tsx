'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { candidates as allCandidates, jobs } from '@/lib/data';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { HiringStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';


const getJobTitle = (jobId: string) => {
    return jobs.find(j => j.id === jobId)?.title || 'Unknown Job';
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
}

const statusColors: Record<HiringStage, string> = {
    Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Interviewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Hired: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};


export default function CandidatesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCandidates = allCandidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getJobTitle(candidate.jobAppliedFor).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground">
          Manage and track all applicants.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>All Candidates</CardTitle>
            <CardDescription>A list of all candidates in your pipeline.</CardDescription>
            <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search by name, email, or job..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied For</TableHead>
                <TableHead>AI Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                        <Link href={`/candidates/${candidate.id}`} className="flex items-center gap-3 group">
                            <Avatar>
                                <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                                <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium group-hover:underline">{candidate.name}</div>
                        </Link>
                    </TableCell>
                    <TableCell>{getJobTitle(candidate.jobAppliedFor)}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Progress value={candidate.matchScore} className="w-24" />
                            <span className="text-sm font-medium">{candidate.matchScore}%</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge className={cn("border-transparent", statusColors[candidate.status])}>
                            {candidate.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {format(parseISO(candidate.appliedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/candidates/${candidate.id}`}>View</Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No candidates found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
