'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { jobs as allJobs, users } from '@/lib/data';
import type { Job } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { format, parseISO } from 'date-fns';

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const filteredJobs = allJobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateJob = user?.role === 'Admin' || user?.role === 'HR';

  const getPosterName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
        <p className="text-muted-foreground">
          Browse and manage job postings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>A list of all jobs in your organization.</CardDescription>
            </div>
            {canCreateJob && (
              <Button asChild>
                <Link href="/jobs/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Job
                </Link>
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search jobs by title or department..."
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
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted On</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>
                      <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(job.postedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{getPosterName(job.postedBy)}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/jobs/${job.id}`}>View</Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No jobs found.
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
